import { useState } from "react";

const TYPE_BADGES = {
  ROOT: { label: "ROOT ZONE (.)", class: "badge-root" },
  TLD: { label: "TLD REGISTRY", class: "badge-tld" },
  AUTHORITATIVE: { label: "AUTHORITATIVE ZONE", class: "badge-auth" },
  UNKNOWN: { label: "DNS NAMESERVER", class: "badge-neutral" },
};

const RESPONSE_BADGES = {
  ANSWER: { label: "ANSWER", class: "resp-ok" },
  REFERRAL: { label: "REFERRAL (DELEGATION)", class: "resp-referral" },
  CNAME: { label: "CNAME (ALIAS)", class: "resp-cname" },
  NODATA: { label: "NODATA (NO RECORD)", class: "resp-warn" },
  NXDOMAIN: { label: "NXDOMAIN", class: "resp-warn" },
  TIMEOUT: { label: "TIMEOUT", class: "resp-err" },
  SERVFAIL: { label: "SERVFAIL", class: "resp-err" },
  REFUSED: { label: "REFUSED", class: "resp-err" },
};

function formatMs(value) {
  return value == null ? "—" : `${value.toFixed(1)} ms`;
}

function DetailSection({ title, count, records, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!records || records.length === 0) return null;

  return (
    <div className="step-packet-section">
      <button
        type="button"
        className="packet-section-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="toggle-icon">{open ? "▾" : "▸"}</span>
        <span className="packet-section-title">{title}</span>
        <span className="packet-count-pill">{count} {count === 1 ? "record" : "records"}</span>
      </button>

      {open && (
        <div className="packet-table-wrapper">
          <table className="packet-table">
            <thead>
              <tr>
                <th>Record Name</th>
                <th>Type</th>
                <th>TTL</th>
                <th>Target / Data Value</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r, i) => (
                <tr key={`${r.name}-${r.type}-${r.value}-${i}`}>
                  <td className="font-mono text-muted">{r.name}</td>
                  <td>
                    <span className="type-pill-sm">{r.type}</span>
                  </td>
                  <td className="font-mono text-amber">{r.ttl}s</td>
                  <td className="font-mono text-bold text-value">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function TraceStep({ step, isHighlighted = false }) {
  const isCache = step.cache_hit;
  const serverBadge = TYPE_BADGES[step.server_type] || TYPE_BADGES.UNKNOWN;
  const respBadge = RESPONSE_BADGES[step.response] || { label: step.response, class: "resp-neutral" };

  return (
    <li
      id={`step-card-${step.step}`}
      className={`step-item-card ${step.sub_resolution ? "is-sub-lookup" : ""} ${isHighlighted ? "is-highlighted-step" : ""}`}
    >
      {/* Step Header */}
      <div className="step-card-header">
        <div className="step-id-group">
          <span className="step-number-badge">STEP {String(step.step).padStart(2, "0")}</span>
          <span className={`step-zone-badge ${isCache ? "badge-cache" : serverBadge.class}`}>
            {isCache ? "LOCAL CACHE" : serverBadge.label}
          </span>
          {step.sub_resolution && (
            <span className="step-glue-badge">GLUE LOOKUP</span>
          )}
        </div>

        <div className="step-metrics-group">
          <span className={`step-response-pill ${respBadge.class}`}>
            {respBadge.label}
          </span>
          <span className="step-latency-badge">
            {isCache ? "⚡ 0.0 ms (In-Memory)" : `⏱ ${formatMs(step.response_time_ms)}`}
          </span>
        </div>
      </div>

      {/* Queried Nameserver Info */}
      <div className="step-target-bar">
        <div className="target-server-identity">
          <span className="target-server-label">Queried Server:</span>
          <strong className="target-server-name">{step.server_name || step.server}</strong>
          {!isCache && step.server_name && (
            <span className="target-server-ip font-mono">({step.server})</span>
          )}
        </div>

        <div className="target-protocol-tag">
          <span className="protocol-chip">
            {isCache ? "Cache Intercept" : `${step.transport || "UDP"}:53`}
          </span>
          {step.tcp_fallback && (
            <span className="tcp-fallback-chip" title="UDP truncated flag (TC=1) triggered fallback to TCP">
              TCP Fallback
            </span>
          )}
        </div>
      </div>

      {/* Protocol Parameters Grid */}
      <div className="step-kv-grid">
        <div className="kv-box">
          <span className="kv-key">Query Hostname</span>
          <span className="kv-val font-mono">{step.query}</span>
        </div>
        <div className="kv-box">
          <span className="kv-key">Query Type</span>
          <span className="kv-val font-mono text-accent">{step.record_type}</span>
        </div>
        <div className="kv-box">
          <span className="kv-key">RCODE</span>
          <span className="kv-val font-mono">{step.rcode ?? "NOERROR"}</span>
        </div>
        <div className="kv-box">
          <span className="kv-key">Authoritative (AA)</span>
          <span className={`kv-val ${step.authoritative ? "text-emerald" : "text-muted"}`}>
            {step.authoritative == null ? "—" : step.authoritative ? "True (Zone Owner)" : "False (Referral)"}
          </span>
        </div>
        <div className="kv-box">
          <span className="kv-key">Min TTL</span>
          <span className="kv-val font-mono text-amber">
            {step.ttl == null ? "—" : `${step.ttl}s`}
          </span>
        </div>
        <div className="kv-box">
          <span className="kv-key">Cache Status</span>
          <span className={`kv-val ${step.cache_hit ? "text-emerald" : "text-muted"}`}>
            {step.cache_hit ? "HIT" : "MISS"}
          </span>
        </div>
      </div>

      {/* Educational / Context Note */}
      {step.note && (
        <div className="step-explanation-box">
          <span className="explanation-icon">💡</span>
          <p className="explanation-text">{step.note}</p>
        </div>
      )}

      {/* Detailed DNS Record Sections */}
      <div className="step-sections-wrapper">
        <DetailSection
          title="Answer Records (ANCOUNT)"
          count={step.records?.length || 0}
          records={step.records}
          defaultOpen={Boolean(step.records?.length)}
        />
        <DetailSection
          title="Authority Nameservers (NSCOUNT)"
          count={step.authority?.length || 0}
          records={step.authority}
          defaultOpen={Boolean(step.authority?.length && !step.records?.length)}
        />
        <DetailSection
          title="Additional Glue Records (ARCOUNT)"
          count={step.additional?.length || 0}
          records={step.additional}
          defaultOpen={false}
        />
      </div>
    </li>
  );
}
