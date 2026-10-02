"""Fake DNS network for deterministic tests (no internet needed).

Register what each fake server says with net.add(ip, qname, rdtype, **spec).
qname "*" is a wildcard. An unregistered (server, name, type) behaves like a TIMEOUT.
"""
import dns.flags
import dns.message
import dns.rcode
import dns.rrset

from engine.transport import QueryOutcome
from models import ErrorCode, Transport


def reply(qname, rdtype, *, rcode="NOERROR", aa=False, answer=(), authority=(), additional=()):
    """Build a real dnspython response. Each record line: (name, ttl, "IN", type, rdata, ...)."""
    msg = dns.message.make_response(dns.message.make_query(qname, rdtype))
    msg.set_rcode(dns.rcode.from_text(rcode))
    if aa:
        msg.flags |= dns.flags.AA
    for section, lines in ((msg.answer, answer), (msg.authority, authority), (msg.additional, additional)):
        for line in lines:
            section.append(dns.rrset.from_text(*line))
    return msg


class FakeNetwork:
    def __init__(self):
        self.table = {}
        self.calls = []

    def add(self, ip, qname, rdtype, **spec):
        self.table[(ip, qname, rdtype)] = spec

    def __call__(self, server_ip, qname, rdtype, timeout=3.0):
        self.calls.append((server_ip, qname, rdtype))
        spec = self.table.get((server_ip, qname, rdtype)) or self.table.get((server_ip, "*", rdtype))
        if spec is None:
            return QueryOutcome(None, timeout * 1000, Transport.UDP, False,
                                ErrorCode.TIMEOUT, f"fake timeout from {server_ip}")
        kw = dict(spec)
        tcp = kw.pop("tcp", False)
        return QueryOutcome(reply(qname, rdtype, **kw), 1.5,
                            Transport.TCP if tcp else Transport.UDP, tcp)
