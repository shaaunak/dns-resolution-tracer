const TYPE_CLASS = { ROOT: "violet", TLD: "accent", AUTHORITATIVE: "ok", UNKNOWN: "warn" };
const RESPONSE_CLASS = { ANSWER: "ok", REFERRAL: "accent", CNAME: "violet", NODATA: "warn" };

function formatMs(value) {
  return value == null ? "-" : `${value.toFixed(1)} ms`;
}

function KV({ label, children }) {
  return (
    <div>
      <dt className="kv-label">{label}</dt>
      <dd className="kv-value">{children}</dd>
    </div>
  );
}

function RecordList({ title, records }) {
  if (!records?.length) return null;
  return (
    <details className="step-details">
      <summary>{title} ({records.length})</summary>
      <div className="answer-wrap">
        <table className="records">
          <thead>
            <tr><th>Name</th><th>Type</th><th>TTL</th><th>Value</th></tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={`${r.name}-${r.type}-${r.value}-${i}`}>
                <td>{r.name}</td>
                <td>{r.type}</td>
                <td>{r.ttl}</td>
                <td>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export default function TraceStep({ step }) {
  const isCache = step.cache_hit;

  return (
    <li className={`step${step.sub_resolution ? " sub" : ""}`}>
      <div className="step-head">
        <span className="step-num">STEP {step.step}</span>
        <span className={`chip ${TYPE_CLASS[step.server_type] ?? ""}`}>
          {isCache ? "APPLICATION CACHE" : step.server_type}
        </span>
        {step.sub_resolution && <span className="chip">NAMESERVER LOOKUP</span>}
        <span className={`chip ${RESPONSE_CLASS[step.response] ?? "err"}`}>{step.response}</span>
        <span className="step-time">{isCache ? "no network query" : formatMs(step.response_time_ms)}</span>
      </div>

      <div className="step-server">
        <strong>{step.server_name || step.server}</strong>
        {!isCache && <code>{step.server}</code>}
      </div>

      <dl className="step-grid">
        <KV label="Query">{step.query}</KV>
        <KV label="Record type">{step.record_type}</KV>
        <KV label="RCODE">{step.rcode ?? "-"}</KV>
        <KV label="Authoritative">
          {step.authoritative == null ? "-" : step.authoritative ? "yes" : "no"}
        </KV>
        <KV label="TTL">{step.ttl == null ? "-" : `${step.ttl} s`}</KV>
        <KV label="Transport">
          {isCache ? "n/a (no network)" : step.transport}
          {!isCache && step.tcp_fallback ? " (TCP fallback)" : ""}
        </KV>
        <KV label="Application cache">{step.cache_hit ? "HIT" : "MISS"}</KV>
      </dl>

      {step.note && <p className="step-note">{step.note}</p>}

      <RecordList title="Answer records" records={step.records} />
      <RecordList title="Authority records" records={step.authority} />
      <RecordList title="Additional records (glue)" records={step.additional} />
    </li>
  );
}
