"""Send a single iterative DNS query (UDP, with TCP fallback) and time it."""
import time
from dataclasses import dataclass

import dns.exception
import dns.message
import dns.query

from models import ErrorCode, Transport


@dataclass
class QueryOutcome:
    response: dns.message.Message | None
    elapsed_ms: float
    transport: Transport
    tcp_fallback: bool
    error: ErrorCode | None = None
    error_detail: str | None = None


def send_query(server_ip: str, qname: str, rdtype: str, timeout: float = 3.0) -> QueryOutcome:
    """Ask `server_ip` for (qname, rdtype) WITHOUT recursion.

    - flags=0 clears the RD bit: we want referrals, not a recursive lookup.
    - EDNS0 with a 1232-byte payload lets most answers fit in one UDP packet.
    - If the reply has the TC (truncated) bit set, udp_with_fallback()
      automatically repeats the query over TCP and reports used_tcp=True.
    - Elapsed time covers the whole exchange, including a TCP retry if one happened.
    """
    try:
        query = dns.message.make_query(qname, rdtype, use_edns=0, payload=1232, flags=0)
    except (dns.exception.DNSException, UnicodeError, ValueError) as exc:
        return QueryOutcome(None, 0.0, Transport.UDP, False,
                            ErrorCode.INVALID_DOMAIN, f"Cannot build query: {exc}")

    start = time.perf_counter()
    try:
        response, used_tcp = dns.query.udp_with_fallback(query, server_ip, timeout=timeout)
    except dns.exception.Timeout:
        return _fail(start, ErrorCode.TIMEOUT, f"No reply from {server_ip} within {timeout}s")
    except OSError as exc:  # unreachable network, connection refused, no route, ...
        return _fail(start, ErrorCode.NETWORK_ERROR, f"{type(exc).__name__}: {exc}")
    except dns.exception.DNSException as exc:  # malformed packet, bad ID, wrong source
        return _fail(start, ErrorCode.PARSE_ERROR, f"{type(exc).__name__}: {exc}")

    elapsed_ms = (time.perf_counter() - start) * 1000
    return QueryOutcome(response, elapsed_ms,
                        Transport.TCP if used_tcp else Transport.UDP, used_tcp)


def _fail(start: float, code: ErrorCode, detail: str) -> QueryOutcome:
    elapsed_ms = (time.perf_counter() - start) * 1000
    return QueryOutcome(None, elapsed_ms, Transport.UDP, False, code, detail)
