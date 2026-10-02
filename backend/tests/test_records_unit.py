"""Deterministic tests for engine.records (no network)."""
import dns.rcode

from dns_fakes import (ANSWER_IP, TLD, answer_spec, nodata_spec, nxdomain_spec,
                       referral_spec, reply, rr)
from engine.records import classify_response, norm
from models import ResponseKind


def test_norm_lowercases_and_strips_trailing_dot():
    assert norm("Google.COM.") == "google.com"


def test_answer_with_ttl():
    msg = reply("google.com", "A", **answer_spec("google.com", "A", ANSWER_IP, ttl=120))
    cls = classify_response(msg, "google.com", "A")
    assert cls.kind == ResponseKind.ANSWER
    assert [r.value for r in cls.final_records] == [ANSWER_IP]
    assert cls.ttl == 120


def test_multiple_records_are_all_returned():
    msg = reply("google.com", "A", **answer_spec("google.com", "A", "203.0.113.5", "203.0.113.6"))
    cls = classify_response(msg, "google.com", "A")
    assert len(cls.final_records) == 2


def test_referral_is_classified_and_glue_extracted():
    msg = reply("google.com", "A", **referral_spec(
        "com", {"a.gtld-servers.net": TLD, "b.gtld-servers.net": None}))
    cls = classify_response(msg, "google.com", "A")
    assert cls.kind == ResponseKind.REFERRAL
    assert cls.zone == "com"
    assert cls.ns_names == ["a.gtld-servers.net", "b.gtld-servers.net"]
    assert cls.glue == {"a.gtld-servers.net": [TLD]}  # b has no glue


def test_empty_reply_is_not_treated_as_answer():
    cls = classify_response(reply("google.com", "A"), "google.com", "A")
    assert cls.kind == ResponseKind.OTHER_ERROR


def test_nxdomain_with_soa_ttl():
    msg = reply("nope.com", "A", **nxdomain_spec("com"))
    cls = classify_response(msg, "nope.com", "A")
    assert cls.kind == ResponseKind.NXDOMAIN
    assert cls.ttl == 900


def test_nodata_when_soa_and_no_answer():
    msg = reply("google.com", "AAAA", **nodata_spec("google.com"))
    cls = classify_response(msg, "google.com", "AAAA")
    assert cls.kind == ResponseKind.NODATA


def test_servfail_and_refused():
    assert classify_response(reply("a.com", "A", rcode=dns.rcode.SERVFAIL), "a.com", "A").kind == ResponseKind.SERVFAIL
    assert classify_response(reply("a.com", "A", rcode=dns.rcode.REFUSED), "a.com", "A").kind == ResponseKind.REFUSED


def test_cname_only_reply_asks_caller_to_restart_for_target():
    msg = reply("www.google.com", "A",
                answer=[rr("www.google.com.", 300, "CNAME", "web.google.com.")], aa=True)
    cls = classify_response(msg, "www.google.com", "A")
    assert cls.kind == ResponseKind.CNAME
    assert cls.cname_target == "web.google.com"
    assert cls.final_records[0].type == "CNAME"


def test_cname_followed_inside_same_reply_and_min_ttl():
    msg = reply("www.google.com", "A", aa=True, answer=[
        rr("www.google.com.", 300, "CNAME", "web.google.com."),
        rr("web.google.com.", 60, "A", ANSWER_IP),
    ])
    cls = classify_response(msg, "www.google.com", "A")
    assert cls.kind == ResponseKind.ANSWER
    assert [r.type for r in cls.final_records] == ["CNAME", "A"]
    assert cls.ttl == 60  # smallest TTL in the chain


def test_asking_for_cname_returns_the_cname_itself():
    msg = reply("www.google.com", "CNAME",
                answer=[rr("www.google.com.", 300, "CNAME", "web.google.com.")], aa=True)
    cls = classify_response(msg, "www.google.com", "CNAME")
    assert cls.kind == ResponseKind.ANSWER
    assert cls.final_records[0].value == "web.google.com."


def test_cname_loop_inside_one_reply_does_not_hang():
    msg = reply("a.google.com", "A", aa=True, answer=[
        rr("a.google.com.", 300, "CNAME", "b.google.com."),
        rr("b.google.com.", 300, "CNAME", "a.google.com."),
    ])
    cls = classify_response(msg, "a.google.com", "A")
    assert cls.kind == ResponseKind.CNAME
    assert cls.cname_target == "a.google.com"  # resolver sees it already visited -> CNAME_LOOP