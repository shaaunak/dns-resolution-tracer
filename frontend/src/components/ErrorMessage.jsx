// Plain-English explanations for every error the backend can return,
// plus two that only the frontend can detect.
const ERRORS = {
  INVALID_DOMAIN: {
    tone: "warn",
    title: "Invalid Domain Name Syntax",
    explain:
      "The input string is not a valid RFC-compliant DNS hostname. Domain names must use alphanumeric characters, hyphens, and valid dot-separated labels (e.g. google.com).",
    tips: [
      "Remove protocol prefixes (http://, https://) and url paths.",
      "Raw IP addresses cannot be traced directly; enter a domain name.",
      "Check for accidental trailing slashes or spaces.",
    ],
  },
  INVALID_RECORD_TYPE: {
    tone: "warn",
    title: "Unsupported Record Type",
    explain: "This iterative DNS engine supports standard query types: A, AAAA, CNAME, NS, MX, and TXT.",
    tips: ["Select a supported record type from the dropdown selector."],
  },
  NXDOMAIN: {
    tone: "warn",
    title: "Domain Does Not Exist (NXDOMAIN — RCODE 3)",
    explain:
      "An authoritative nameserver confirmed that this domain name (or a canonical name alias target) does not exist in the DNS zone hierarchy.",
    tips: [
      "Verify the spelling of the domain name.",
      "The domain might be expired or not yet registered with a registrar.",
      "This is a valid authoritative DNS response, not an application error.",
    ],
  },
  NODATA: {
    tone: "warn",
    title: "No Records of Requested Type (NODATA)",
    explain: (type) =>
      `The domain name exists in the zone, but has no active ${type ?? "requested"} resource records configured. For example, an IPv4-only server has no AAAA (IPv6) records.`,
    tips: [
      "Try querying for A records instead of AAAA or MX.",
      "Check if the domain uses a CNAME or TXT record.",
    ],
  },
  SERVFAIL: {
    tone: "err",
    title: "Nameserver Failure (SERVFAIL — RCODE 2)",
    explain:
      "The queried nameserver encountered an internal zone failure, DNSSEC validation failure, or misconfigured zone delegation.",
    tips: [
      "The domain's DNS provider may be experiencing an outage.",
      "DNSSEC keys for this domain might be misconfigured.",
      "Retry the query to test secondary nameservers.",
    ],
  },
  REFUSED: {
    tone: "err",
    title: "Query Refused (REFUSED — RCODE 5)",
    explain: "The destination nameserver refused to process this query due to access control or rate-limiting policies.",
    tips: ["The nameserver might only permit queries from authorized resolver subnets."],
  },
  TIMEOUT: {
    tone: "err",
    title: "Socket Query Timeout",
    explain:
      "A DNS nameserver failed to respond to UDP datagrams within the 3.0s timeout window across all retry attempts.",
    tips: [
      "Check your local network connection.",
      "Ensure outbound UDP/TCP port 53 traffic is not blocked by local firewalls.",
      "The remote nameserver may be experiencing heavy load or packet loss.",
    ],
  },
  NETWORK_ERROR: {
    tone: "err",
    title: "Network Socket Error",
    explain: "The backend could not create or bind an outbound network socket to send DNS queries.",
    tips: ["Check internet connectivity on the server running the backend."],
  },
  PARSE_ERROR: {
    tone: "err",
    title: "DNS Wire Format Parse Error",
    explain:
      "The nameserver returned an unparseable or corrupted DNS wire message that violated RFC specifications.",
    tips: ["This usually indicates a non-compliant or buggy DNS server implementation."],
  },
  CNAME_LOOP: {
    tone: "err",
    title: "Canonical Name Alias Loop Detected",
    explain:
      "The domain's CNAME records redirect cyclically (e.g. A -> B -> A). The resolver halted to prevent an infinite recursion loop.",
    tips: ["The domain owner must fix their circular CNAME DNS configuration."],
  },
  MAX_DEPTH_EXCEEDED: {
    tone: "err",
    title: "Maximum Traversal Depth Exceeded",
    explain:
      "The resolution chain exceeded safety limits (16 referrals, 8 CNAME hops, or 40 total queries) and was halted.",
    tips: ["The domain has an excessively deep or fragmented delegation structure."],
  },
  NO_NAMESERVERS: {
    tone: "err",
    title: "No Reachable Nameservers in Referral",
    explain:
      "A referral response contained no usable glue IP addresses and resolving the nameserver hostnames failed.",
    tips: ["Zone delegation contains broken NS records with no corresponding glue."],
  },
  INTERNAL_ERROR: {
    tone: "err",
    title: "Internal Engine Error",
    explain: "An unexpected exception occurred during iterative trace processing.",
    tips: ["Check the backend terminal logs for detailed stack traces."],
  },
  BACKEND_UNREACHABLE: {
    tone: "err",
    title: "Backend Engine Unreachable",
    explain: "The frontend was unable to connect to the FastAPI backend service.",
    tips: [
      "Ensure the Python backend is running: cd backend && uvicorn main:app --port 8000",
      "Click the health indicator pill at the top right to re-check connection.",
    ],
  },
  BAD_RESPONSE: {
    tone: "err",
    title: "Unexpected API Response",
    explain: "The server returned an unparseable response payload instead of the expected JSON trace schema.",
    tips: ["Verify that the correct FastAPI backend application is running on port 8000."],
  },
};

export default function ErrorMessage({ code, message, step, recordType }) {
  const info = ERRORS[code] ?? {
    tone: "err",
    title: "Resolution Diagnostic Error",
    explain: "The backend returned an unspecified error code.",
    tips: [],
  };
  const explain = typeof info.explain === "function" ? info.explain(recordType) : info.explain;

  return (
    <div className={`error-diagnostic-card tone-${info.tone}`} role="alert">
      <div className="error-card-top">
        <div className="error-badge-group">
          <span className="error-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <span className="error-code-badge">{code}</span>
        </div>
        <h3 className="error-card-title">{info.title}</h3>
      </div>

      <p className="error-explain-text">{explain}</p>

      {message && (
        <div className="error-detail-box">
          <span className="detail-label">Wire / Engine Detail:</span>
          <span className="detail-content font-mono">{message}</span>
        </div>
      )}

      {info.tips.length > 0 && (
        <div className="error-tips-section">
          <span className="tips-heading">Troubleshooting Suggestions:</span>
          <ul className="tips-list">
            {info.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {step != null && (
        <div className="error-step-note">
          Incident halted execution during <strong>Step #{step}</strong> of the resolution path.
        </div>
      )}
    </div>
  );
}
