"""LIVE integration tests: these send REAL DNS queries over the internet.

Run them with:   python -m pytest -m live -v
They are excluded from the normal `python -m pytest` run because they need network
access and real-world DNS data can change. They assert STRUCTURE (steps, types, flags),
not specific IP addresses.
"""
import ipaddress
import re
import uuid

import pytest

from cache import DnsCache
from engine.resolver import Resolver
from engine.tracer import Tracer
from models import ErrorCode, ResponseKind, ServerType

pytestmark = pytest.mark.live


@pytest.fixture()
def tracer():
    return Tracer(cache=DnsCache())  # fresh cache, real Resolver, real roots


FAILED_KINDS = {ResponseKind.TIMEOUT, ResponseKind.NETWORK_ERROR, ResponseKind.PARSE_ERROR,
                ResponseKind.SERVFAIL, ResponseKind.REFUSED, ResponseKind.OTHER_ERROR}


def assert_real_walk(r):
    """Common checks for any successful iterative trace.

    A real root/TLD server can time out; the resolver then tries another one. Those failed
    attempts are recorded as steps too, so we judge the walk by its SUCCESSFUL steps.
    """
    assert r.error is None, r.error
    good = [s for s in r.steps if s.response not in FAILED_KINDS]
    assert len(good) >= 3
    assert good[0].server_type == ServerType.ROOT
    assert good[0].response == ResponseKind.REFERRAL
    assert good[-1].server_type == ServerType.AUTHORITATIVE
    assert good[-1].response == ResponseKind.ANSWER
    assert good[-1].authoritative is True              # AA flag from the real server
    assert r.steps[-1] is good[-1]                     # the trace ends on the answer
    assert all(s.response_time_ms is not None and s.response_time_ms > 0 for s in r.steps)
    assert [s.step for s in r.steps] == list(range(1, len(r.steps) + 1))
    assert r.total_time_ms >= sum(s.response_time_ms for s in r.steps) * 0.99
    assert r.cache_hit is False and r.ttl and r.ttl > 0 and r.final_answer


def test_google_a(tracer):
    r = tracer.trace("google.com", "A")
    assert_real_walk(r)
    assert {x.type for x in r.final_answer} == {"A"}
    for rec in r.final_answer:
        assert isinstance(ipaddress.ip_address(rec.value), ipaddress.IPv4Address)


def test_google_aaaa(tracer):
    r = tracer.trace("google.com", "AAAA")
    assert_real_walk(r)
    for rec in r.final_answer:
        assert isinstance(ipaddress.ip_address(rec.value), ipaddress.IPv6Address)


def test_google_ns_comes_from_the_authoritative_server_not_the_parent(tracer):
    r = tracer.trace("google.com", "NS")
    assert_real_walk(r)
    assert {x.type for x in r.final_answer} == {"NS"} and len(r.final_answer) >= 2
    # The TLD's reply for NS is a referral (NS in AUTHORITY); the true answer comes later.
    assert any(s.server_type == ServerType.TLD and s.response == ResponseKind.REFERRAL for s in r.steps)


def test_google_mx_multiple_or_single_record(tracer):
    r = tracer.trace("google.com", "MX")
    assert_real_walk(r)
    assert all(x.type == "MX" and re.match(r"^\d+ \S+", x.value) for x in r.final_answer)


def test_google_txt_records(tracer):
    r = tracer.trace("google.com", "TXT")
    assert_real_walk(r)
    assert all(x.type == "TXT" for x in r.final_answer) and len(r.final_answer) >= 1


def test_cname_followed_for_a_query(tracer):
    r = tracer.trace("www.github.com", "A")
    if r.error is not None or "CNAME" not in {x.type for x in r.final_answer}:
        pytest.skip("www.github.com is no longer a CNAME; pick another alias to demo")
    types = [x.type for x in r.final_answer]
    assert types[0] == "CNAME" and types[-1] == "A"   # alias first, then the real address


def test_cname_query_returns_the_alias_itself(tracer):
    r = tracer.trace("www.github.com", "CNAME")
    if r.error is not None and r.error.code == ErrorCode.NODATA:
        pytest.skip("www.github.com is no longer a CNAME")
    assert r.error is None
    assert {x.type for x in r.final_answer} == {"CNAME"}


def test_nxdomain_for_random_name(tracer):
    r = tracer.trace(f"does-not-exist-{uuid.uuid4().hex[:12]}.com", "A")
    assert r.error is not None and r.error.code == ErrorCode.NXDOMAIN
    assert r.final_answer == []
    assert r.steps[-1].response == ResponseKind.NXDOMAIN and r.steps[-1].rcode == "NXDOMAIN"


def test_cache_miss_then_hit_with_real_dns(tracer):
    first = tracer.trace("google.com", "A")
    second = tracer.trace("google.com", "A")
    assert first.cache_hit is False and second.cache_hit is True
    assert len(first.steps) >= 3 and len(second.steps) == 1 and second.steps[0].cache_hit
    assert second.total_time_ms < first.total_time_ms
    assert second.ttl <= first.ttl
    tracer.cache.clear()
    assert tracer.trace("google.com", "A").cache_hit is False


def test_unreachable_server_is_a_structured_error_not_a_crash():
    # 192.0.2.1 is TEST-NET-1: reserved for documentation, nothing answers there.
    t = Tracer(cache=DnsCache(),
               resolver_factory=lambda: Resolver(roots=[("blackhole", "192.0.2.1")], timeout=1.0))
    r = t.trace("google.com", "A")
    assert r.error is not None and r.error.code in (ErrorCode.TIMEOUT, ErrorCode.NETWORK_ERROR)
    assert r.steps and r.steps[0].response in (ResponseKind.TIMEOUT, ResponseKind.NETWORK_ERROR)


def test_invalid_input_needs_no_network(tracer):
    assert tracer.trace("not a domain!!", "A").error.code == ErrorCode.INVALID_DOMAIN
    assert tracer.trace("google.com", "BOGUS").error.code == ErrorCode.INVALID_RECORD_TYPE