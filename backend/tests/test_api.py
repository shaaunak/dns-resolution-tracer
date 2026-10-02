from fastapi.testclient import TestClient

from cache import DnsCache
from engine.resolver import Resolver
from engine.tracer import Tracer
from main import create_app
from test_tracer_unit import ROOTS, build, world_with_answer
from tracer_fakes import FakeNetwork

TRACE_KEYS = {"domain", "record_type", "final_answer", "total_time_ms", "cache_hit", "ttl", "steps", "error"}


def client(net=None):
    tracer, clock = build(net or world_with_answer())
    return TestClient(create_app(tracer)), clock


def post(c, domain="example.com", rtype="A"):
    return c.post("/api/trace", json={"domain": domain, "record_type": rtype})


def test_health():
    c, _ = client()
    body = c.get("/api/health").json()
    assert body["status"] == "ok" and body["cache"]["entries"] == 0


def test_trace_success_contract():
    c, _ = client()
    r = post(c)
    assert r.status_code == 200
    body = r.json()
    assert TRACE_KEYS <= set(body)
    assert body["error"] is None and body["cache_hit"] is False and body["ttl"] == 300
    assert body["final_answer"][0]["value"] == "192.0.2.10"
    assert [s["server_type"] for s in body["steps"]] == ["ROOT", "TLD", "AUTHORITATIVE"]
    assert body["total_time_ms"] > 0


def test_second_request_is_cache_hit_then_clear_forces_miss():
    c, _ = client()
    post(c)
    hit = post(c).json()
    assert hit["cache_hit"] is True and len(hit["steps"]) == 1 and hit["steps"][0]["cache_hit"] is True
    assert c.get("/api/health").json()["cache"]["entries"] == 1
    assert c.post("/api/cache/clear").json()["cleared"] == 1
    assert post(c).json()["cache_hit"] is False


def test_cache_expires_after_ttl():
    c, clock = client()
    post(c)
    clock.t += 301
    assert post(c).json()["cache_hit"] is False


def test_record_type_defaults_to_a_and_is_case_insensitive():
    c, _ = client()
    assert c.post("/api/trace", json={"domain": "example.com"}).status_code == 200
    assert post(c, "EXAMPLE.com", "a").status_code == 200


def test_invalid_domain_and_record_type_are_400_with_structured_error():
    c, _ = client()
    r = post(c, "not a domain!!")
    assert r.status_code == 400 and r.json()["error"]["code"] == "INVALID_DOMAIN"
    r = post(c, "example.com", "BOGUS")
    assert r.status_code == 400 and r.json()["error"]["code"] == "INVALID_RECORD_TYPE"


def test_malformed_body_is_422_structured():
    c, _ = client()
    for payload in ({}, {"domain": 123}, {"domain": "a" * 5000}, {"domain": "x.com", "record_type": "A" * 99}):
        r = c.post("/api/trace", json=payload)
        assert r.status_code == 422 and r.json()["error"]["message"].startswith("Malformed request")
    assert c.post("/api/trace", content="not json", headers={"content-type": "application/json"}).status_code == 422


def test_dns_level_failures_are_200_with_error_object():
    c, _ = client(FakeNetwork())  # every server times out
    r = post(c)
    assert r.status_code == 200 and r.json()["error"]["code"] == "TIMEOUT" and r.json()["final_answer"] == []


def test_internal_error_is_500_but_still_structured():
    def boom(*a, **k): raise RuntimeError("kaboom")
    tracer = Tracer(cache=DnsCache(), resolver_factory=lambda: Resolver(send=boom, roots=ROOTS))
    r = post(TestClient(create_app(tracer)))
    assert r.status_code == 500 and r.json()["error"]["code"] == "INTERNAL_ERROR"


def test_cors_allows_the_future_react_dev_server():
    c, _ = client()
    r = c.options("/api/trace", headers={"Origin": "http://localhost:5173",
                                         "Access-Control-Request-Method": "POST"})
    assert r.headers["access-control-allow-origin"] == "http://localhost:5173"
