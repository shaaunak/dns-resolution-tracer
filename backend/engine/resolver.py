"""Iterative resolver: walks Root -> TLD -> Authoritative and records every query.

Create ONE Resolver per trace (it keeps the step list and query budget as state).
The network function is injectable so unit tests can run without internet.
"""
from dataclasses import dataclass, replace
from typing import Callable

import dns.flags
import dns.rcode

from engine.records import Classification, classify_response, norm, section_to_records
from engine.roots import root_candidates
from engine.transport import QueryOutcome, send_query
from models import DnsRecord, ErrorCode, ErrorInfo, ResponseKind, ServerType, TraceStep

SendFn = Callable[..., QueryOutcome]

_RESPONSE_TO_ERROR = {
    ResponseKind.SERVFAIL: ErrorCode.SERVFAIL,
    ResponseKind.REFUSED: ErrorCode.REFUSED,
    ResponseKind.OTHER_ERROR: ErrorCode.PARSE_ERROR,
}


class ResolutionError(Exception):
    def __init__(self, code: ErrorCode, message: str, step: int | None = None):
        super().__init__(message)
        self.code, self.message, self.step = code, message, step


@dataclass
class ResolveResult:
    kind: ResponseKind | None
    final_records: list[DnsRecord]
    steps: list[TraceStep]
    error: ErrorInfo | None
    ttl: int | None


def server_type_for(zone: str) -> ServerType:
    """Label a server by the zone that referred us to it (a simplification)."""
    z = norm(zone)
    if z == "":
        return ServerType.ROOT
    return ServerType.TLD if "." not in z else ServerType.AUTHORITATIVE


class Resolver:
    def __init__(self, send: SendFn = send_query, roots: list[tuple[str, str]] | None = None, *,
                 timeout: float = 3.0, max_referrals: int = 16, max_cname: int = 8,
                 max_ns_depth: int = 3, max_queries: int = 40,
                 max_servers_per_level: int = 4, use_ipv6: bool = False):
        self._send = send
        self.use_ipv6 = use_ipv6
        self.roots = roots if roots is not None else root_candidates(use_ipv6=use_ipv6)
        self.timeout = timeout
        self.max_referrals = max_referrals
        self.max_cname = max_cname
        self.max_ns_depth = max_ns_depth
        self.max_queries = max_queries
        self.max_servers_per_level = max_servers_per_level
        self.steps: list[TraceStep] = []
        self._queries = 0

    # ---------- public ----------
    def resolve(self, qname: str, rdtype: str) -> ResolveResult:
        self.steps, self._queries = [], 0
        try:
            cls = self._resolve_chain(qname, rdtype, ns_depth=0, sub=False)
        except ResolutionError as exc:
            return ResolveResult(None, [], self.steps,
                                 ErrorInfo(code=exc.code, message=exc.message,
                                           step=exc.step or len(self.steps) or None), None)
        error = None
        if cls.kind == ResponseKind.NXDOMAIN:
            error = ErrorInfo(code=ErrorCode.NXDOMAIN, step=len(self.steps),
                              message=f"The name does not exist (authoritative NXDOMAIN for '{qname}' or its CNAME target)")
        elif cls.kind == ResponseKind.NODATA:
            error = ErrorInfo(code=ErrorCode.NODATA, step=len(self.steps),
                              message=f"The name exists but has no {rdtype} records (empty answer)")
        return ResolveResult(cls.kind, cls.final_records, self.steps, error, cls.ttl)

    # ---------- CNAME chain ----------
    def _resolve_chain(self, qname: str, rdtype: str, ns_depth: int, sub: bool) -> Classification:
        current = norm(qname)
        seen = {current}
        collected: list[DnsRecord] = []
        for _ in range(self.max_cname + 1):
            cls = self._walk(current, rdtype, ns_depth, sub)
            collected = collected + cls.final_records
            if cls.kind != ResponseKind.CNAME:
                return replace(cls, final_records=collected)
            target = cls.cname_target
            if target in seen:
                raise ResolutionError(ErrorCode.CNAME_LOOP,
                                      f"CNAME loop detected: '{target}' was already visited", len(self.steps))
            seen.add(target)
            current = target
        raise ResolutionError(ErrorCode.MAX_DEPTH_EXCEEDED,
                              f"More than {self.max_cname} CNAME hops", len(self.steps))

    # ---------- root -> ... -> answer ----------
    def _walk(self, qname: str, rdtype: str, ns_depth: int, sub: bool) -> Classification:
        servers, zone = list(self.roots), "."
        for _ in range(self.max_referrals):
            cls = self._ask_level(servers, zone, qname, rdtype, sub)
            if cls.kind != ResponseKind.REFERRAL:
                return cls
            zone = cls.zone or zone
            servers = self._next_servers(cls, ns_depth, sub)
        raise ResolutionError(ErrorCode.MAX_DEPTH_EXCEEDED,
                              f"More than {self.max_referrals} referrals for '{qname}'", len(self.steps))

    def _ask_level(self, servers, zone, qname, rdtype, sub) -> Classification:
        """Ask servers of one level until one gives a usable reply."""
        if not servers:
            raise ResolutionError(ErrorCode.NO_NAMESERVERS, "No nameserver addresses to query", len(self.steps))
        stype = server_type_for(zone)
        last_code, last_msg = ErrorCode.TIMEOUT, "no servers tried"
        for name, ip in servers[: self.max_servers_per_level]:
            if self._queries >= self.max_queries:
                raise ResolutionError(ErrorCode.MAX_DEPTH_EXCEEDED,
                                      f"Query budget of {self.max_queries} exhausted", len(self.steps))
            self._queries += 1
            outcome = self._send(ip, qname, rdtype, timeout=self.timeout)

            if outcome.error is not None:
                if outcome.error == ErrorCode.INVALID_DOMAIN:
                    raise ResolutionError(ErrorCode.INVALID_DOMAIN, outcome.error_detail or "invalid name")
                self._add_step(name, ip, stype, qname, rdtype, outcome, ResponseKind[outcome.error.value],
                               note=outcome.error_detail, sub=sub)
                last_code, last_msg = outcome.error, outcome.error_detail or outcome.error.value
                continue

            try:
                cls = classify_response(outcome.response, qname, rdtype)
            except Exception as exc:  # malformed content must never crash the trace
                self._add_step(name, ip, stype, qname, rdtype, outcome, ResponseKind.PARSE_ERROR,
                               note=f"Could not parse reply: {exc}", sub=sub)
                last_code, last_msg = ErrorCode.PARSE_ERROR, f"Could not parse reply from {ip}: {exc}"
                continue

            self._add_step(name, ip, stype, qname, rdtype, outcome, cls.kind, cls=cls, sub=sub)
            if cls.kind in _RESPONSE_TO_ERROR:
                last_code = _RESPONSE_TO_ERROR[cls.kind]
                last_msg = f"{ip} replied {cls.kind.value}"
                continue
            return cls
        raise ResolutionError(last_code, f"All tried servers failed. Last error: {last_msg}", len(self.steps))

    # ---------- referral -> next server addresses ----------
    def _usable(self, ip: str) -> bool:
        return self.use_ipv6 or ":" not in ip

    def _next_servers(self, cls: Classification, ns_depth: int, sub: bool) -> list[tuple[str, str]]:
        servers = [(ns, ip) for ns in cls.ns_names for ip in cls.glue.get(ns, []) if self._usable(ip)]
        if servers:
            return servers  # glue gave us addresses directly

        # No usable glue: resolve a nameserver's own address from the roots (sub-resolution).
        if ns_depth >= self.max_ns_depth:
            raise ResolutionError(ErrorCode.MAX_DEPTH_EXCEEDED,
                                  f"Nameserver lookups nested deeper than {self.max_ns_depth}", len(self.steps))
        want = "AAAA" if self.use_ipv6 else "A"
        for ns in cls.ns_names[:3]:
            try:
                res = self._resolve_chain(ns, want, ns_depth + 1, sub=True)
            except ResolutionError as exc:
                if exc.code == ErrorCode.MAX_DEPTH_EXCEEDED:
                    raise
                continue
            servers = [(ns, r.value) for r in res.final_records if r.type == want]
            if servers:
                return servers
        raise ResolutionError(ErrorCode.NO_NAMESERVERS,
                              f"Could not find an address for any nameserver of '{cls.zone}'", len(self.steps))

    # ---------- step recording ----------
    def _add_step(self, name, ip, stype, qname, rdtype, outcome, kind, *, cls=None, note=None, sub=False):
        msg = outcome.response
        if cls is not None and note is None:
            if kind == ResponseKind.REFERRAL:
                note = (f"Referral to '{cls.zone}': {len(cls.ns_names)} nameservers, "
                        f"glue for {len(cls.glue)}")
            elif kind == ResponseKind.CNAME:
                note = f"Alias to '{cls.cname_target}'; restarting resolution for the target"
        self.steps.append(TraceStep(
            step=len(self.steps) + 1, server=ip, server_name=name, server_type=stype,
            query=qname, record_type=rdtype, response=kind,
            rcode=dns.rcode.to_text(msg.rcode()) if msg is not None else None,
            authoritative=bool(msg.flags & dns.flags.AA) if msg is not None else None,
            records=section_to_records(msg.answer) if msg is not None else [],
            authority=section_to_records(msg.authority) if msg is not None else [],
            additional=section_to_records(msg.additional) if msg is not None else [],
            response_time_ms=round(outcome.elapsed_ms, 2), ttl=cls.ttl if cls else None,
            transport=outcome.transport, tcp_fallback=outcome.tcp_fallback,
            sub_resolution=sub, note=note,
        ))
