"""Turn raw dnspython messages into our models and decide what a reply MEANS.

The key function is classify_response(): given one server reply it answers
"is this the final answer, an alias (CNAME), a referral to a lower server,
'name exists but no such type' (NODATA), or an error?"
"""
from dataclasses import dataclass, field

import dns.name
import dns.rcode
import dns.rdatatype

from models import DnsRecord, ResponseKind

MAX_CHAIN_IN_ANSWER = 8  # CNAME hops we will follow inside ONE reply


def norm(name) -> str:
    """Canonical text for a DNS name: lowercase, no trailing dot."""
    text = name.to_text() if isinstance(name, dns.name.Name) else str(name)
    return text.lower().rstrip(".")


def rrset_to_records(rrset) -> list[DnsRecord]:
    type_text = dns.rdatatype.to_text(rrset.rdtype)
    return [
        DnsRecord(name=rrset.name.to_text(), type=type_text, ttl=rrset.ttl, value=rdata.to_text())
        for rdata in rrset
    ]


def section_to_records(section) -> list[DnsRecord]:
    records: list[DnsRecord] = []
    for rrset in section:
        if rrset.rdtype == dns.rdatatype.OPT:  # EDNS pseudo-record, not real data
            continue
        records.extend(rrset_to_records(rrset))
    return records


def min_ttl(records: list[DnsRecord]) -> int | None:
    return min((r.ttl for r in records), default=None)


@dataclass
class Classification:
    kind: ResponseKind
    final_records: list[DnsRecord] = field(default_factory=list)  # ANSWER / CNAME chain
    cname_target: str | None = None      # set when kind == CNAME
    zone: str | None = None              # set when kind == REFERRAL (zone being delegated)
    ns_names: list[str] = field(default_factory=list)
    glue: dict[str, list[str]] = field(default_factory=dict)  # ns name -> [ip, ...]
    ttl: int | None = None


def _find(section, name: dns.name.Name, rdtype: int):
    for rrset in section:
        if rrset.rdtype == rdtype and rrset.name == name:
            return rrset
    return None


def _first_of_type(section, rdtype: int):
    for rrset in section:
        if rrset.rdtype == rdtype:
            return rrset
    return None


def classify_response(msg, qname: str, rdtype: str) -> Classification:
    rcode = msg.rcode()
    if rcode == dns.rcode.NXDOMAIN:
        soa = _first_of_type(msg.authority, dns.rdatatype.SOA)
        return Classification(ResponseKind.NXDOMAIN, ttl=soa.ttl if soa else None)
    if rcode == dns.rcode.SERVFAIL:
        return Classification(ResponseKind.SERVFAIL)
    if rcode == dns.rcode.REFUSED:
        return Classification(ResponseKind.REFUSED)
    if rcode != dns.rcode.NOERROR:
        return Classification(ResponseKind.OTHER_ERROR)

    want = dns.rdatatype.from_text(rdtype)
    current = dns.name.from_text(qname)
    seen = {current}
    chain = []

    # 1) ANSWER section: wanted type, or a CNAME chain we can follow inside this reply.
    for _ in range(MAX_CHAIN_IN_ANSWER):
        direct = _find(msg.answer, current, want)
        if direct is not None:
            chain.append(direct)
            records = [r for rrset in chain for r in rrset_to_records(rrset)]
            return Classification(ResponseKind.ANSWER, final_records=records, ttl=min_ttl(records))
        if want != dns.rdatatype.CNAME:
            alias = _find(msg.answer, current, dns.rdatatype.CNAME)
            if alias is not None:
                chain.append(alias)
                current = alias[0].target
                if current in seen:  # loop inside the reply; resolver will report it
                    break
                seen.add(current)
                continue
        break

    if chain:  # ended on a CNAME with no final record: caller must restart for the target
        records = [r for rrset in chain for r in rrset_to_records(rrset)]
        return Classification(ResponseKind.CNAME, final_records=records,
                              cname_target=norm(current), ttl=min_ttl(records))

    # 2) AUTHORITY section: SOA means "I'm authoritative; name exists but no such type".
    soa = _first_of_type(msg.authority, dns.rdatatype.SOA)
    if soa is not None:
        return Classification(ResponseKind.NODATA, ttl=soa.ttl)

    # 3) AUTHORITY section: NS means "ask these servers instead" (a referral).
    ns_rrset = _first_of_type(msg.authority, dns.rdatatype.NS)
    if ns_rrset is not None:
        ns_names = [norm(rd.target) for rd in ns_rrset]
        glue: dict[str, list[str]] = {}
        for rrset in msg.additional:  # glue: addresses of the nameservers above
            if rrset.rdtype in (dns.rdatatype.A, dns.rdatatype.AAAA):
                glue.setdefault(norm(rrset.name), []).extend(rd.address for rd in rrset)
        return Classification(ResponseKind.REFERRAL, zone=norm(ns_rrset.name),
                              ns_names=ns_names, glue=glue, ttl=ns_rrset.ttl)

    return Classification(ResponseKind.OTHER_ERROR)  # empty reply, no SOA, no NS (lame server)
