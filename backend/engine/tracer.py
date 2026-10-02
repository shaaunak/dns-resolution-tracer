"""Orchestration: validate -> our cache -> iterative resolution -> TraceResult.

The resolver walks the DNS hierarchy; this layer adds input validation, our own
cache, total timing (perf_counter) and guarantees that nothing escapes as an exception.
"""
import time
from typing import Callable

from cache import DnsCache
from engine.resolver import Resolver
from engine.validation import InputValidationError, normalize_domain, validate_record_type
from models import (ErrorCode, ErrorInfo, ResponseKind, ServerType, TraceResult, TraceStep)


def _ms(start: float) -> float:
    return round((time.perf_counter() - start) * 1000, 2)


def _echo(value: object) -> str:
    return (value if isinstance(value, str) else repr(value))[:100]


class Tracer:
    def __init__(self, cache: DnsCache | None = None,
                 resolver_factory: Callable[[], Resolver] | None = None):
        self.cache = cache if cache is not None else DnsCache()
        self._factory = resolver_factory or Resolver  # a fresh Resolver per trace (it is stateful)

    def trace(self, domain: object, record_type: object) -> TraceResult:
        start = time.perf_counter()
        try:
            name = normalize_domain(domain)
            rtype = validate_record_type(record_type)
        except InputValidationError as exc:
            code = getattr(exc, "code", ErrorCode.INVALID_DOMAIN)
            return TraceResult(domain=_echo(domain), record_type=_echo(record_type),
                               total_time_ms=_ms(start),
                               error=ErrorInfo(code=code, message=getattr(exc, "message", str(exc))))

        hit = self.cache.get(name, rtype)
        if hit is not None:
            step = TraceStep(
                step=1, server="application-cache", server_name="local application cache",
                server_type=ServerType.UNKNOWN, query=name, record_type=rtype,
                response=ResponseKind.ANSWER, rcode="NOERROR", records=hit.final_answer,
                response_time_ms=_ms(start), ttl=hit.remaining_ttl, cache_hit=True,
                note=(f"Served from this application's own cache (entry age {hit.age_s}s, "
                      f"{hit.remaining_ttl}s of TTL left). No DNS query was sent."))
            return TraceResult(domain=name, record_type=rtype, final_answer=hit.final_answer,
                               total_time_ms=_ms(start), cache_hit=True,
                               ttl=hit.remaining_ttl, steps=[step])

        resolver = self._factory()
        try:
            res = resolver.resolve(name, rtype)
        except Exception as exc:  # last line of defence: never crash the API
            return TraceResult(domain=name, record_type=rtype, steps=list(getattr(resolver, "steps", [])),
                               total_time_ms=_ms(start),
                               error=ErrorInfo(code=ErrorCode.INTERNAL_ERROR,
                                               message=f"Unexpected {type(exc).__name__}: {exc}"))

        if res.error is None:
            self.cache.set(name, rtype, res.final_records, res.ttl)  # errors are never cached
        return TraceResult(domain=name, record_type=rtype, final_answer=res.final_records,
                           total_time_ms=_ms(start), cache_hit=False, ttl=res.ttl,
                           steps=res.steps, error=res.error)
