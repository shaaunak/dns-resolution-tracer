from models import ResponseKind, ServerType, TraceStep


def test_step_serializes_with_defaults():
    step = TraceStep(step=1, server="198.41.0.4", server_type=ServerType.ROOT,
                     query="google.com", record_type="A", response=ResponseKind.REFERRAL)
    data = step.model_dump(mode="json")
    assert data["server_type"] == "ROOT"
    assert data["response"] == "REFERRAL"
    assert data["cache_hit"] is False
    assert data["records"] == []
    assert data["ttl"] is None
