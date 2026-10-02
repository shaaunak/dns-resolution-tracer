from cache import DnsCache
from models import DnsRecord


class Clock:
    def __init__(self): self.t = 1000.0
    def __call__(self): return self.t


def rec(ttl=300, value="192.0.2.1"):
    return DnsRecord(name="example.com.", type="A", ttl=ttl, value=value)


def test_miss_then_hit():
    c = DnsCache(clock=Clock())
    assert c.get("example.com", "A") is None
    assert c.set("example.com", "A", [rec()], 300)
    hit = c.get("example.com", "A")
    assert hit is not None and hit.final_answer[0].value == "192.0.2.1"
    assert (c.hits, c.misses) == (1, 1)


def test_ttl_counts_down_and_entry_expires():
    clk = Clock(); c = DnsCache(clock=clk)
    c.set("example.com", "A", [rec(300)], 300)
    clk.t += 100
    hit = c.get("example.com", "A")
    assert hit.remaining_ttl == 200 and hit.final_answer[0].ttl == 200
    clk.t += 199.9
    assert c.get("example.com", "A") is not None   # still 0.1s left
    clk.t += 0.2
    assert c.get("example.com", "A") is None       # expired
    assert len(c) == 0


def test_key_is_case_and_trailing_dot_insensitive_and_type_specific():
    c = DnsCache(clock=Clock())
    c.set("Example.COM.", "a", [rec()], 60)
    assert c.get("example.com", "A") is not None
    assert c.get("example.com", "AAAA") is None


def test_uncacheable_results_are_not_stored():
    c = DnsCache(clock=Clock())
    assert not c.set("example.com", "A", [], 300)
    assert not c.set("example.com", "A", [rec()], 0)
    assert not c.set("example.com", "A", [rec()], None)
    assert len(c) == 0


def test_clear_returns_count_and_empties():
    c = DnsCache(clock=Clock())
    c.set("a.com", "A", [rec()], 60); c.set("b.com", "A", [rec()], 60)
    assert c.clear() == 2 and len(c) == 0 and c.get("a.com", "A") is None


def test_max_entries_evicts_oldest():
    clk = Clock(); c = DnsCache(clock=clk, max_entries=2)
    for i, d in enumerate(["a.com", "b.com", "c.com"]):
        clk.t += 1; c.set(d, "A", [rec()], 600)
    assert len(c) == 2 and c.get("a.com", "A") is None and c.get("c.com", "A") is not None
