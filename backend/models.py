"""Pydantic models: the JSON contract between the DNS engine and any client."""
from enum import Enum

from pydantic import BaseModel, Field


class ServerType(str, Enum):
    ROOT = "ROOT"
    TLD = "TLD"
    AUTHORITATIVE = "AUTHORITATIVE"
    UNKNOWN = "UNKNOWN"


class ResponseKind(str, Enum):
    """How we classified what a server sent back for one query."""
    REFERRAL = "REFERRAL"            # no answer; NS records point further down
    ANSWER = "ANSWER"                # requested record type returned
    CNAME = "CNAME"                  # alias returned; must restart for target
    NODATA = "NODATA"                # name exists, requested type does not
    NXDOMAIN = "NXDOMAIN"            # name does not exist
    SERVFAIL = "SERVFAIL"
    REFUSED = "REFUSED"
    TIMEOUT = "TIMEOUT"
    NETWORK_ERROR = "NETWORK_ERROR"
    PARSE_ERROR = "PARSE_ERROR"
    OTHER_ERROR = "OTHER_ERROR"


class Transport(str, Enum):
    UDP = "UDP"
    TCP = "TCP"


class ErrorCode(str, Enum):
    INVALID_DOMAIN = "INVALID_DOMAIN"
    INVALID_RECORD_TYPE = "INVALID_RECORD_TYPE"
    NXDOMAIN = "NXDOMAIN"
    NODATA = "NODATA"
    SERVFAIL = "SERVFAIL"
    REFUSED = "REFUSED"
    TIMEOUT = "TIMEOUT"
    NETWORK_ERROR = "NETWORK_ERROR"
    PARSE_ERROR = "PARSE_ERROR"
    CNAME_LOOP = "CNAME_LOOP"
    MAX_DEPTH_EXCEEDED = "MAX_DEPTH_EXCEEDED"
    NO_NAMESERVERS = "NO_NAMESERVERS"
    INTERNAL_ERROR = "INTERNAL_ERROR"


class DnsRecord(BaseModel):
    name: str
    type: str
    ttl: int
    value: str


class TraceStep(BaseModel):
    step: int
    server: str                              # IP address queried
    server_name: str | None = None           # e.g. "a.root-servers.net" if known
    server_type: ServerType
    query: str                               # domain being asked about at this step
    record_type: str
    response: ResponseKind
    rcode: str | None = None                 # NOERROR, NXDOMAIN, SERVFAIL, ...
    authoritative: bool | None = None        # AA flag from the response header
    records: list[DnsRecord] = Field(default_factory=list)     # ANSWER section
    authority: list[DnsRecord] = Field(default_factory=list)   # AUTHORITY section
    additional: list[DnsRecord] = Field(default_factory=list)  # ADDITIONAL (glue)
    response_time_ms: float | None = None    # measured with perf_counter
    ttl: int | None = None                   # min TTL of the records that matter here
    transport: Transport = Transport.UDP
    tcp_fallback: bool = False               # True if UDP reply was truncated (TC bit)
    cache_hit: bool = False                  # OUR cache only
    sub_resolution: bool = False             # True if this step resolves a NS hostname
    note: str | None = None


class ErrorInfo(BaseModel):
    code: ErrorCode
    message: str
    step: int | None = None


class TraceResult(BaseModel):
    domain: str
    record_type: str
    final_answer: list[DnsRecord] = Field(default_factory=list)
    total_time_ms: float = 0.0
    cache_hit: bool = False                  # OUR cache only
    ttl: int | None = None
    steps: list[TraceStep] = Field(default_factory=list)
    error: ErrorInfo | None = None
