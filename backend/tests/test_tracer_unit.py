from cache import DnsCache
from tracer_fakes import FakeNetwork
from engine.resolver import Resolver
from engine.tracer import Tracer
from models import ErrorCode

ROOT, TLD, AUTH = "198.41.0.4", "192.5.6.30", "216.239.32.10"
ROOTS = [("a.root-servers.net", ROOT)]


def make_world(domain="example.com"):
    """Fake internet: root -> .com (glue) -> example.com nameserver (glue)."""
    net = FakeNetwork()
    for t in ["A", "AAAA", "NS", "MX", "TXT", "CNAME"]:
        net.add(ROOT, "*", t, authority=[("com.", 172800, "IN", "NS", "a.gtld-servers.net.")],
                additional=[("a.gtld-servers.net.", 172800, "IN", "A", TLD)])
        net.add(TLD, "*", t, authority=[(f"{domain}.", 172800, "IN", "NS", f"ns1.{domain}.")],
                additional=[(f"ns1.{domain}.", 172800, "IN", "A", AUTH)])
    return net


class Clock:
    def __init__(self): self.t = 1000.0
    def __call__(self): return self.t


def build(net, clk=None):
    clk = clk or Clock()
    tracer = Tracer(cache=DnsCache(clock=clk),
                    resolver_factory=lambda: Resolver(send=net, roots=ROOTS))
    return tracer, clk


def world_with_answer():
    net = make_world()
    net.add(AUTH, "example.com", "A", aa=True, answer=[("example.com.", 300, "IN", "A", "192.0.2.10")])
    return net


def test_first_call_is_miss_with_real_trace():
    tracer, _ = build(world_with_answer())
    r = tracer.trace("example.com", "A")
    assert r.error is None and r.cache_hit is False and r.ttl == 300
    assert len(r.steps) == 3 and r.total_time_ms > 0
    assert r.final_answer[0].value == "192.0.2.10"
    assert all(s.cache_hit is False for s in r.steps)


def test_second_call_is_cache_hit_without_network():
    net = world_with_answer(); tracer, clk = build(net)
    tracer.trace("example.com", "A"); calls = len(net.calls)
    clk.t += 100
    r = tracer.trace("EXAMPLE.com", "a")
    assert r.cache_hit is True and len(net.calls) == calls
    assert r.ttl == 200 and len(r.steps) == 1 and r.steps[0].cache_hit is True
    assert r.final_answer[0].value == "192.0.2.10"


def test_expired_entry_triggers_fresh_dns_query():
    net = world_with_answer(); tracer, clk = build(net)
    tracer.trace("example.com", "A"); calls = len(net.calls)
    clk.t += 301
    r = tracer.trace("example.com", "A")
    assert r.cache_hit is False and len(net.calls) == calls * 2 and len(r.steps) == 3


def test_clear_forces_miss():
    net = world_with_answer(); tracer, _ = build(net)
    tracer.trace("example.com", "A")
    assert tracer.cache.clear() == 1
    assert tracer.trace("example.com", "A").cache_hit is False


def test_errors_are_not_cached():
    net = make_world()
    soa = [("example.com.", 900, "IN", "SOA", "ns1.example.com. h.example.com. 1 2 3 4 900")]
    net.add(AUTH, "nope.example.com", "A", rcode="NXDOMAIN", aa=True, authority=soa)
    tracer, _ = build(net)
    r1 = tracer.trace("nope.example.com", "A"); n = len(net.calls)
    r2 = tracer.trace("nope.example.com", "A")
    assert r1.error.code == r2.error.code == ErrorCode.NXDOMAIN
    assert r2.cache_hit is False and len(net.calls) == n * 2


def test_invalid_input_returns_structured_error_without_network():
    net = world_with_answer(); tracer, _ = build(net)
    bad_domain = tracer.trace("exa mple..com", "A")
    bad_type = tracer.trace("example.com", "XYZ")
    assert bad_domain.error.code == ErrorCode.INVALID_DOMAIN
    assert bad_type.error.code == ErrorCode.INVALID_RECORD_TYPE
    assert net.calls == []


def test_unexpected_exception_becomes_internal_error():
    def boom(*a, **k): raise RuntimeError("kaboom")
    tracer = Tracer(cache=DnsCache(), resolver_factory=lambda: Resolver(send=boom, roots=ROOTS))
    r = tracer.trace("example.com", "A")
    assert r.error.code == ErrorCode.INTERNAL_ERROR and "kaboom" in r.error.message


def test_timeout_is_reported_not_raised():
    tracer = Tracer(cache=DnsCache(), resolver_factory=lambda: Resolver(send=FakeNetwork(), roots=ROOTS))
    r = tracer.trace("example.com", "A")
    assert r.error.code == ErrorCode.TIMEOUT and r.cache_hit is False and r.final_answer == []