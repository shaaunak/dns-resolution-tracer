// Plain-English explanations for every error the backend can return,
// plus two that only the frontend can detect.
const ERRORS = {
  INVALID_DOMAIN: {
    tone: "warn",
    title: "Invalid domain name",
    explain:
      "The text could not be used as a DNS name. Domain names use letters, digits and hyphens, with dots between the parts, for example google.com.",
    tips: ["Remove http://, paths, spaces and port numbers.", "IP addresses are not domain names."],
  },
  INVALID_RECORD_TYPE: {
    tone: "warn",
    title: "Unsupported record type",
    explain: "This tool supports A, AAAA, CNAME, NS, MX and TXT records.",
    tips: ["Pick a type from the dropdown."],
  },
  NXDOMAIN: {
    tone: "warn",
    title: "Domain does not exist (NXDOMAIN)",
    explain:
      "A DNS server answered authoritatively that this name, or the target of one of its aliases, does not exist. This is a genuine DNS answer, not a fault in the tool.",
    tips: ["Check the spelling.", "The domain may simply not be registered."],
  },
  NODATA: {
    tone: "warn",
    title: "No records of this type",
    explain: (type) =>
      `The name exists, but it has no ${type ?? "such"} records. For example, a host that only has an IPv4 address has no AAAA record.`,
    tips: ["Try a different record type."],
  },
  SERVFAIL: {
    tone: "err",
    title: "Server failure (SERVFAIL)",
    explain:
      "A DNS server reported that it could not process the query, for example because of a misconfigured zone. None of the servers tried gave a usable answer.",
    tips: ["Try again in a moment.", "The domain's own DNS setup may be broken."],
  },
  REFUSED: {
    tone: "err",
    title: "Query refused",
    explain: "A DNS server refused to answer. Some servers only answer certain clients.",
    tips: ["Try again; another server may answer."],
  },
  TIMEOUT: {
    tone: "err",
    title: "No response (timeout)",
    explain:
      "A DNS server did not answer within 3 seconds. The tool tries several servers at each level before giving up.",
    tips: [
      "Check your internet connection.",
      "A firewall or network may be blocking DNS traffic (UDP port 53).",
      "Try again; a single slow server is normal.",
    ],
  },
  NETWORK_ERROR: {
    tone: "err",
    title: "Network error",
    explain: "The DNS query could not be sent from the machine running the backend.",
    tips: ["Check your internet connection."],
  },
  PARSE_ERROR: {
    tone: "err",
    title: "Unusable reply",
    explain:
      "A server sent a reply this tool could not use, such as a malformed message or an empty reply with no answer and no referral.",
    tips: ["Try again; this is usually a misbehaving server."],
  },
  CNAME_LOOP: {
    tone: "err",
    title: "CNAME loop",
    explain:
      "Aliases (CNAME records) point to each other in a circle, so the name can never resolve. The tool detected the loop and stopped.",
    tips: ["The domain's DNS records need to be fixed by its owner."],
  },
  MAX_DEPTH_EXCEEDED: {
    tone: "err",
    title: "Resolution limit reached",
    explain:
      "The trace hit a safety limit (16 referrals, 8 alias hops, 3 nested nameserver lookups, or 40 queries) and was stopped.",
    tips: ["This protects against endless chains of redirections."],
  },
  NO_NAMESERVERS: {
    tone: "err",
    title: "No usable nameserver",
    explain:
      "A referral did not provide usable nameserver addresses, and looking the addresses up also failed.",
    tips: ["Try again; this can be temporary."],
  },
  INTERNAL_ERROR: {
    tone: "err",
    title: "Internal error",
    explain: "Something unexpected went wrong inside the backend.",
    tips: ["Look at the terminal running uvicorn for details."],
  },
  BACKEND_UNREACHABLE: {
    tone: "err",
    title: "Backend not reachable",
    explain: "The browser could not contact the API.",
    tips: [
      "Start it: cd ~/dns-tracer/backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000",
      "Then click the status pill at the top right to re-check.",
    ],
  },
  BAD_RESPONSE: {
    tone: "err",
    title: "Unexpected response",
    explain: "The server answered, but not with the JSON this app expects.",
    tips: ["Make sure the DNS tracer backend is the program running on port 8000."],
  },
};

export default function ErrorMessage({ code, message, step, recordType }) {
  const info = ERRORS[code] ?? {
    tone: "err",
    title: "Something went wrong",
    explain: "The backend reported an error this app does not recognise.",
    tips: [],
  };
  const explain = typeof info.explain === "function" ? info.explain(recordType) : info.explain;

  return (
    <div className={`error-card ${info.tone}`} role="alert">
      <div className="error-head">
        <span className="error-code">{code}</span>
        <h3>{info.title}</h3>
      </div>
      <p>{explain}</p>
      {message && <p className="error-detail">Details: {message}</p>}
      {info.tips.length > 0 && (
        <ul className="error-tips">
          {info.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      )}
      {step != null && <small>Reported at step {step}</small>}
    </div>
  );
}
