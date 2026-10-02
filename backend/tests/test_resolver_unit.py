"""Deterministic Resolver tests. A FakeNetwork replaces the internet."""
from dns_fakes import (ANSWER_IP, AUTH, ROOT, ROOT2, TLD, TLD2, FakeNetwork, answer_spec,
                       delegation_net, nodata_spec, nxdomain_spec, referral_spec, rr,
                       standard_net)
import dns.rcode

from engine.resolver import Resolver, server_type_for
from models import ErrorCode, ResponseKind, ServerType, Transport


def make(net, roots=None, **kw):
    return Resolver(send=net, roots=roots or [("a.root-servers.net", ROOT)], **kw)


def test_server_type_labels():
    assert server_type_for(".") == ServerType.ROOT
    assert server_type_for("com.") == ServerType.TLD
    assert server_type_for("google.com.") == ServerType.AUTHORITATIVE


def test_google_a_walks_root_tld_authoritative():
    res = make(standard_net()).resolve("google.com", "A")
    assert res.error is None and res.kind == ResponseKind.ANSWER
    assert [s.server_type for s in res.steps] == [ServerType.ROOT, ServerType.TLD, ServerType.AUTHORITATIVE]
    assert [s.response for s in res.steps] == [ResponseKind.REFERRAL, ResponseKind.REFERRAL, ResponseKind.ANSWER]
    assert [s.server for s in res.steps] == [ROOT, TLD, AUTH]
    assert [s.step for s in res.steps] == [1, 2, 3]
    assert res.steps[0].additional[0].value == TLD  # glue came from the Additional section
    assert res.steps[2].authoritative is True
    assert res.steps[0].authoritative is False
    assert all(s.response_time_ms > 0 for s in res.steps)
    assert [r.value for r in res.final_records] == [ANSWER_IP]
    assert res.ttl == 300


def test_multiple_records():
    net = delegation_net("A")
    net.add(AUTH, "google.com", "A", **answer_spec("google.com", "A", "203.0.113.5", "203.0.113.6"))
    res = make(net).resolve("google.com", "A")
    assert len(res.final_records) == 2


def test_nxdomain_is_a_structured_error():
    net = delegation_net("A")
    net.add(AUTH, "nope.google.com", "A", **nxdomain_spec("google.com"))
    res = make(net).resolve("nope.google.com", "A")
    assert res.kind == ResponseKind.NXDOMAIN
    assert res.error.code == ErrorCode.NXDOMAIN
    assert res.final_records == []
    assert res.steps[-1].rcode == "NXDOMAIN"


def test_nodata_when_type_missing():
    net = delegation_net("AAAA")
    net.add(AUTH, "google.com", "AAAA", **nodata_spec("google.com"))
    res = make(net).resolve("google.com", "AAAA")
    assert res.kind == ResponseKind.NODATA
    assert res.error.code == ErrorCode.NODATA


def test_timeout_is_recorded_not_raised():
    res = make(FakeNetwork()).resolve("google.com", "A")
    assert res.kind is None
    assert res.error.code == ErrorCode.TIMEOUT
    assert len(res.steps) == 1 and res.steps[0].response == ResponseKind.TIMEOUT
    assert res.steps[0].rcode is None


def test_network_error_is_recorded():
    net = FakeNetwork()
    net.add(ROOT, "*", "A", error=ErrorCode.NETWORK_ERROR, detail="boom")
    res = make(net).resolve("google.com", "A")
    assert res.error.code == ErrorCode.NETWORK_ERROR
    assert res.steps[0].response == ResponseKind.NETWORK_ERROR
    assert res.steps[0].note == "boom"


def test_second_root_is_tried_when_first_fails():
    net = delegation_net("A", root=ROOT2)  # ROOT is not registered -> timeout
    net.add(AUTH, "google.com", "A", **answer_spec("google.com", "A", ANSWER_IP))
    res = make(net, roots=[("a.root", ROOT), ("b.root", ROOT2)]).resolve("google.com", "A")
    assert res.error is None
    assert res.steps[0].server == ROOT and res.steps[0].response == ResponseKind.TIMEOUT
    assert res.steps[1].server == ROOT2 and res.steps[1].response == ResponseKind.REFERRAL
    assert len(res.steps) == 4


def test_servfail_from_authoritative():
    net = delegation_net("A")
    net.add(AUTH, "google.com", "A", rcode=dns.rcode.SERVFAIL)
    res = make(net).resolve("google.com", "A")
    assert res.error.code == ErrorCode.SERVFAIL
    assert res.steps[-1].response == ResponseKind.SERVFAIL


def test_empty_reply_from_lame_server_is_an_error():
    net = delegation_net("A")
    net.add(AUTH, "google.com", "A")  # empty reply: no answer, no SOA, no NS
    res = make(net).resolve("google.com", "A")
    assert res.error.code == ErrorCode.PARSE_ERROR
    assert res.steps[-1].response == ResponseKind.OTHER_ERROR


def test_cname_chain_restarts_from_root():
    net = delegation_net("A")
    net.add(AUTH, "www.google.com", "A", aa=True,
            answer=[rr("www.google.com.", 300, "CNAME", "web.google.com.")])
    net.add(AUTH, "web.google.com", "A", **answer_spec("web.google.com", "A", ANSWER_IP))
    res = make(net).resolve("www.google.com", "A")
    assert res.error is None and res.kind == ResponseKind.ANSWER
    assert [r.type for r in res.final_records] == ["CNAME", "A"]
    assert [s.response for s in res.steps] == [
        ResponseKind.REFERRAL, ResponseKind.REFERRAL, ResponseKind.CNAME,
        ResponseKind.REFERRAL, ResponseKind.REFERRAL, ResponseKind.ANSWER]
    assert "web.google.com" in res.steps[2].note


def test_cname_loop_across_replies_is_detected():
    net = delegation_net("A")
    net.add(AUTH, "a.google.com", "A", aa=True, answer=[rr("a.google.com.", 300, "CNAME", "b.google.com.")])
    net.add(AUTH, "b.google.com", "A", aa=True, answer=[rr("b.google.com.", 300, "CNAME", "a.google.com.")])
    res = make(net).resolve("a.google.com", "A")
    assert res.error.code == ErrorCode.CNAME_LOOP
    assert res.kind is None


def test_cname_chain_too_long_hits_max_depth():
    net = delegation_net("A")
    for i in range(10):
        net.add(AUTH, f"h{i}.google.com", "A", aa=True,
                answer=[rr(f"h{i}.google.com.", 300, "CNAME", f"h{i + 1}.google.com.")])
    res = make(net, max_cname=2).resolve("h0.google.com", "A")
    assert res.error.code == ErrorCode.MAX_DEPTH_EXCEEDED


def test_query_budget_stops_runaway_traces():
    net = standard_net()
    res = make(net, max_queries=2).resolve("google.com", "A")
    assert res.error.code == ErrorCode.MAX_DEPTH_EXCEEDED
    assert len(net.calls) == 2


def test_tcp_fallback_is_recorded_on_the_step():
    net = delegation_net("A")
    net.add(AUTH, "google.com", "A", tcp=True, **answer_spec("google.com", "A", ANSWER_IP))
    res = make(net).resolve("google.com", "A")
    assert res.steps[0].transport == Transport.UDP and res.steps[0].tcp_fallback is False
    assert res.steps[-1].transport == Transport.TCP and res.steps[-1].tcp_fallback is True


def test_glueless_referral_triggers_sub_resolution():
    net = FakeNetwork()
    net.add(ROOT, "*", "A", **referral_spec("com", {"a.gtld-servers.net": TLD}))
    net.add(TLD, "*", "A", **referral_spec("example.com", {"ns.other.net": None}))  # no glue
    # sub-trace for the nameserver's own address:
    net.add(ROOT, "ns.other.net", "A", **referral_spec("net", {"a.net-servers.net": TLD2}))
    net.add(TLD2, "ns.other.net", "A", **answer_spec("ns.other.net", "A", AUTH))
    net.add(AUTH, "www.example.com", "A", **answer_spec("www.example.com", "A", ANSWER_IP))
    res = make(net).resolve("www.example.com", "A")
    assert res.error is None
    assert [s.sub_resolution for s in res.steps] == [False, False, True, True, False]
    assert res.steps[-1].server == AUTH
    assert [r.value for r in res.final_records] == [ANSWER_IP]
