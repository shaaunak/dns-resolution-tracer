"""FastAPI layer: HTTP only. All DNS logic lives in engine/ and cache.py.

Run:  uvicorn main:app --reload --port 8000     then open http://127.0.0.1:8000/docs

Status-code policy (documented so the frontend can rely on it):
  200  the trace ran. A DNS-level outcome such as NXDOMAIN, NODATA or TIMEOUT is still a
       200 with the `error` object filled in: the API worked, the DNS answer was "no".
  400  your input was rejected (INVALID_DOMAIN / INVALID_RECORD_TYPE)
  422  the JSON body itself is malformed (missing field, wrong type, too long)
  500  INTERNAL_ERROR (a bug on our side, still returned as structured JSON)
"""
import time

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from engine.tracer import Tracer
from models import ErrorCode, ErrorInfo, TraceResult

MAX_FIELD_LEN = 300  # generous; the real domain length rule (253) lives in validation.py


class TraceRequest(BaseModel):
    domain: str = Field(..., max_length=MAX_FIELD_LEN, examples=["google.com"])
    record_type: str = Field("A", max_length=16, examples=["A"])


def get_tracer(request: Request) -> Tracer:
    return request.app.state.tracer


def create_app(tracer: Tracer | None = None) -> FastAPI:
    app = FastAPI(title="DNS Resolution Tracer", version="1.0.0",
                  description="Iterative DNS tracing engine: Root -> TLD -> Authoritative, "
                              "with an application-level TTL cache.")
    app.state.tracer = tracer or Tracer()
    app.state.started = time.time()

    import os
    extra_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                       "http://localhost:3000", "http://127.0.0.1:3000"] + extra_origins,
        allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["*"])

    @app.exception_handler(RequestValidationError)
    async def bad_request_body(request: Request, exc: RequestValidationError):
        fields = {str(p) for e in exc.errors() for p in e.get("loc", ())}
        code = ErrorCode.INVALID_RECORD_TYPE if "record_type" in fields and "domain" not in fields \
            else ErrorCode.INVALID_DOMAIN
        first = exc.errors()[0] if exc.errors() else {}
        loc = ".".join(str(p) for p in first.get("loc", ()) if p != "body") or "body"
        body = exc.body if isinstance(exc.body, dict) else {}
        result = TraceResult(
            domain=str(body.get("domain", ""))[:100], record_type=str(body.get("record_type", ""))[:16],
            error=ErrorInfo(code=code, message=f"Malformed request ({loc}): {first.get('msg', 'invalid body')}"))
        return JSONResponse(status_code=422, content=result.model_dump(mode="json"))

    @app.get("/api/health")
    def health(tracer: Tracer = Depends(get_tracer)):
        return {"status": "ok", "service": "dns-tracer",
                "uptime_s": round(time.time() - app.state.started, 1),
                "cache": {"entries": len(tracer.cache), "hits": tracer.cache.hits,
                          "misses": tracer.cache.misses}}

    # Plain `def` (not async): FastAPI runs it in a worker thread, so a slow DNS trace
    # never blocks other requests.
    @app.post("/api/trace", response_model=TraceResult)
    def trace(req: TraceRequest, tracer: Tracer = Depends(get_tracer)):
        result = tracer.trace(req.domain, req.record_type)
        status = 200
        if result.error is not None:
            if result.error.code in (ErrorCode.INVALID_DOMAIN, ErrorCode.INVALID_RECORD_TYPE):
                status = 400
            elif result.error.code == ErrorCode.INTERNAL_ERROR:
                status = 500
        return JSONResponse(status_code=status, content=result.model_dump(mode="json"))

    @app.post("/api/cache/clear")
    def clear_cache(tracer: Tracer = Depends(get_tracer)):
        return {"cleared": tracer.cache.clear(), "message": "Application DNS cache cleared"}

    return app


app = create_app()
