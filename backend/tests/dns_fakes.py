"""Test helpers: build real dnspython messages and a fake network.

Nothing here touches the internet. The IPs below are from the reserved
documentation ranges (192.0.2.0/24, 203.0.113.0/24): they are test labels only.
"""
import dns.flags
import dns.message
import dns.rcode
import dns.rrset

from engine.records import norm
from engine.transport import QueryOutcome
from models import ErrorCode, Transport

ROOT = "192.0.2.1"
ROOT2 = "192.0.2.2"
TLD = "192.0.2.10"
TLD2 = "192.0.2.11"
AUTH = "192.0.2.20"
ANSWER_IP = "203.0.113.5"


def _abs(name: str) -> str:
    return name if name.endswith(".") else name + "."


def rr(name, ttl, rtype, *values):
    """One RRset, e.g. rr('google.com.', 300, 'A', '203.0.113.5')."""
    return dns.rrset.from_text(_abs(name), ttl, "IN", rtype, *values)


def reply(qname, rdtype, *, answer=(), authority=(), additional=(),
          rcode=dns.rcode.NOERROR, aa=False, tc=False):
    """Build a real DNS response message."""
    msg = dns.message.make_response(dns.message.make_query(qname, rdtype))
    msg.set_rcode(rcode)
    if aa:
        msg.flags |= dns.flags.AA
    if tc:
        msg.flags |= dns.flags.TC
    msg.answer.extend(answer)
    msg.authority.extend(authority)
    msg.additional.extend(additional)
    return msg


# ---- "spec" helpers: keyword dicts you can pass to reply() or net.add() ----
def referral_spec(zone, ns_ips):
    """Referral to `zone`. ns_ips = {ns_name: ip or None}. None = no glue."""
    names = [_abs(n) for n in ns_ips]
    return {
        "authority": [rr(zone, 172800, "NS", *names)],
        "additional": [rr(n, 172800, "A", ip) for n, ip in ns_ips.items() if ip],
    }


def answer_spec(name, rtype, *values, ttl=300):
    return {"answer": [rr(name, ttl, rtype, *values)], "aa": True}


def soa(zone, ttl=900):
    return rr(zone, ttl, "SOA", "ns.example. admin.example. 1 3600 600 86400 300")


def nxdomain_spec(zone):
    return {"rcode": dns.rcode.NXDOMAIN, "authority": [soa(zone)], "aa": True}


def nodata_spec(zone):
    return {"authority": [soa(zone)], "aa": True}


# ---- fake network ----
class FakeNetwork:
    """Callable with the same signature as engine.transport.send_query.

    net.add(ip, qname_or_"*", rdtype, **spec)
      spec keys: anything reply() accepts, plus
        ms=1.5        simulated response time
        tcp=True      simulate a TC-bit fallback to TCP
        error=ErrorCode.X, detail="..."   simulate a transport failure
    Anything not registered behaves like a timeout.
    """

    def __init__(self):
        self.script = {}
        self.calls = []  # (ip, qname, rdtype) for every query made

    def add(self, ip, qname, rdtype, *, ms=1.5, tcp=False, error=None, detail=None, **spec):
        key = (ip, "*" if qname == "*" else norm(qname), rdtype.upper())
        self.script[key] = {"ms": ms, "tcp": tcp, "error": error, "detail": detail, "spec": spec}

    def __call__(self, server_ip, qname, rdtype, timeout=3.0):
        self.calls.append((server_ip, qname, rdtype))
        entry = (self.script.get((server_ip, norm(qname), rdtype))
                 or self.script.get((server_ip, "*", rdtype)))
        if entry is None:
            return QueryOutcome(response=None, elapsed_ms=timeout * 1000, transport=Transport.UDP,
                                tcp_fallback=False, error=ErrorCode.TIMEOUT,
                                error_detail=f"No reply from {server_ip} (fake network)")
        if entry["error"] is not None:
            return QueryOutcome(response=None, elapsed_ms=entry["ms"], transport=Transport.UDP,
                                tcp_fallback=False, error=entry["error"],
                                error_detail=entry["detail"])
        tcp = entry["tcp"]
        return QueryOutcome(response=reply(qname, rdtype, **entry["spec"]), elapsed_ms=entry["ms"],
                            transport=Transport.TCP if tcp else Transport.UDP, tcp_fallback=tcp,
                            error=None, error_detail=None)


def delegation_net(rdtype="A", root=ROOT):
    """Root -> TLD(com) -> authoritative(google.com) referrals only. Tests add the final answer."""
    net = FakeNetwork()
    net.add(root, "*", rdtype, **referral_spec("com", {"a.gtld-servers.net": TLD}))
    net.add(TLD, "*", rdtype, **referral_spec("google.com", {"ns1.google.com": AUTH}))
    return net


def standard_net():
    """A complete happy-path google.com A lookup."""
    net = delegation_net("A")
    net.add(AUTH, "google.com", "A", **answer_spec("google.com", "A", ANSWER_IP))
    return net