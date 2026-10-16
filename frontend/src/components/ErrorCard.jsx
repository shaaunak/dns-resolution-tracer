import React from "react";

const ERROR_DESCRIPTIONS = {
  INVALID_DOMAIN: {
    title: "Invalid Domain Syntax",
    explain: "The domain name provided violates RFC 1035 naming rules (e.g., illegal characters, empty labels, or exceeding 253 characters).",
    advice: "Please enter a valid domain format such as google.com or cloudflare.com.",
  },
  INVALID_RECORD_TYPE: {
    title: "Unsupported Record Type",
    explain: "The requested DNS record type is not supported by this resolver.",
    advice: "Supported query types: A (IPv4), AAAA (IPv6), CNAME (Alias), NS (Name Servers), MX (Mail), TXT (Text).",
  },
  NXDOMAIN: {
    title: "Non-Existent Domain (NXDOMAIN)",
    explain: "The authoritative nameserver confirmed that this domain name does not exist in the DNS root or TLD registry.",
    advice: "Verify the spelling of the domain name or check if the domain registration has expired.",
  },
  NODATA: {
    title: "No Records for Requested Type (NODATA)",
    explain: "The domain name exists, but the authoritative nameservers hold no records of the requested type (e.g., querying AAAA for an IPv4-only host).",
    advice: "Try querying for another record type (such as A or NS) for this domain.",
  },
  SERVFAIL: {
    title: "Server Failure (SERVFAIL)",
    explain: "An upstream nameserver encountered an internal processing error or broken delegation while resolving the query.",
    advice: "This is usually caused by misconfigured upstream authoritative infrastructure. Try again or try a different server.",
  },
  REFUSED: {
    title: "Query Refused (REFUSED)",
    explain: "The nameserver refused to process the iterative query according to administrative zone policy.",
    advice: "Iterative queries require open query access. The target server may only accept authorized recursive traffic.",
  },
  TIMEOUT: {
    title: "Nameserver Query Timeout",
    explain: "No UDP response was received from the remote nameserver within the 3.0-second timeout threshold.",
    advice: "The target server may be down, or outbound UDP port 53 traffic might be throttled or blocked by your network.",
  },
  NETWORK_ERROR: {
    title: "Network Socket Error",
    explain: "The operating system socket failed to send or receive packets to the remote nameserver.",
    advice: "Ensure your machine has internet access with outgoing UDP and TCP traffic allowed on port 53.",
  },
  PARSE_ERROR: {
    title: "DNS Wire Format Parse Error",
    explain: "The response payload returned by the nameserver could not be decoded according to standard RFC wire specifications.",
    advice: "The server sent an unexpected or corrupt packet structure.",
  },
  CNAME_LOOP: {
    title: "CNAME Loop Detected",
    explain: "The resolver detected a circular CNAME referral chain (e.g., a.com points to b.com which points back to a.com).",
    advice: "Resolution was halted to avoid an infinite loop. The domain DNS zone contains circular records.",
  },
  MAX_DEPTH_EXCEEDED: {
    title: "Maximum Recursion Depth Exceeded",
    explain: "The iterative trace exceeded the safety limits (16 referrals, 8 CNAME hops, or 40 queries per trace).",
    advice: "The domain exhibits deeply nested delegations or excessive redirect chains.",
  },
  NO_NAMESERVERS: {
    title: "No Usable Nameservers",
    explain: "The resolver received a referral without glue records and was unable to discover reachable IP addresses for the delegated nameservers.",
    advice: "Check that the parent zone delegation includes valid in-bailiwick glue records.",
  },
  INTERNAL_ERROR: {
    title: "Internal Engine Error",
    explain: "An unhandled exception occurred in the backend iterative engine.",
    advice: "Please check backend terminal logs for additional diagnostic details.",
  },
  BACKEND_UNREACHABLE: {
    title: "Cannot Connect to Backend Engine",
    explain: "The frontend was unable to connect to the FastAPI backend at http://127.0.0.1:8000.",
    advice: "Start the local backend server using: uvicorn main:app --port 8000",
  },
};

export default function ErrorCard({ error, onRetry }) {
  if (!error) return null;

  const code = error.code || "INTERNAL_ERROR";
  const info = ERROR_DESCRIPTIONS[code] || {
    title: "Resolution Error",
    explain: error.message || "An unexpected error occurred during iterative DNS resolution.",
    advice: "Check the domain input and try again.",
  };

  const isBackendDown = code === "BACKEND_UNREACHABLE";

  return (
    <div
      className="hairline-card"
      style={{
        padding: "24px",
        marginBottom: "24px",
        backgroundColor: "var(--bg-surface)",
        border: "1.5px solid var(--color-error-border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            backgroundColor: "var(--color-error-bg)",
            border: "1px solid var(--color-error-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-error)",
            fontSize: "16px",
            flexShrink: 0,
          }}
        >
          !
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "18px",
                fontWeight: 600,
                color: "var(--color-error)",
              }}
            >
              {info.title}
            </span>
            <span className="badge badge-error">{code}</span>
          </div>

          <p style={{ fontSize: "13px", color: "var(--color-text-main)", lineHeight: 1.5, marginBottom: "8px" }}>
            {error.message || info.explain}
          </p>

          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--bg-surface-recessed)",
              borderRadius: "var(--radius-xs)",
              fontSize: "12px",
              color: "var(--color-text-main)",
              fontFamily: isBackendDown ? "var(--font-mono)" : "inherit",
              lineHeight: 1.5,
              marginBottom: isBackendDown ? "14px" : "0",
            }}
          >
            <strong>Recommended action:</strong> {info.advice}
          </div>

          {onRetry && (
            <div style={{ marginTop: "12px" }}>
              <button type="button" onClick={onRetry} className="btn-secondary" style={{ fontSize: "12px" }}>
                Retry Query
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
