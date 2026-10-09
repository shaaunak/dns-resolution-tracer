import "./extras.css";

const ERR = new Set([
  "TIMEOUT",
  "SERVFAIL",
  "REFUSED",
  "NETWORK_ERROR",
  "PARSE_ERROR",
  "OTHER_ERROR",
]);
const WARN = new Set(["NXDOMAIN", "NODATA"]);

function toneFor(step) {
  const r = step.response;
  if (ERR.has(r)) return "err";
  if (WARN.has(r)) return "warn";
  if (r === "ANSWER") return "ok";
  if (r === "CNAME") return "cname";
  if (step.server_type === "ROOT") return "root";
  if (step.server_type === "TLD") return "tld";
  if (step.server_type === "AUTHORITATIVE") return "auth";
  return "accent";
}

function labelFor(step) {
  if (step.sub_resolution) return "NS LOOKUP";
  if (!step.server_type || step.server_type === "UNKNOWN") return "DNS SERVER";
  return step.server_type;
}

export default function TimeChart({ steps }) {
  const rows = (steps || []).filter(
    (s) => !s.cache_hit && typeof s.response_time_ms === "number"
  );
  if (rows.length === 0) return null;

  const max = Math.max(...rows.map((s) => s.response_time_ms), 1);
  const sum = rows.reduce((total, s) => total + s.response_time_ms, 0);

  return (
    <section className="time-chart-card" aria-labelledby="latency-chart-heading">
      <div className="time-chart-header">
        <div className="time-chart-title-group">
          <span className="time-chart-tag">Query Latency Waterfall</span>
          <h3 id="latency-chart-heading" className="time-chart-title">
            Step-by-Step Round-Trip Latency (RTT)
          </h3>
        </div>
        <div className="time-chart-meta">
          <span className="sum-tag">
            Total Network RTT: <strong>{sum.toFixed(1)} ms</strong>
          </span>
        </div>
      </div>

      <div className="time-chart-body">
        <ul className="latency-list">
          {rows.map((s, i) => {
            const pct = Math.max((s.response_time_ms / max) * 100, 2);
            const share = sum > 0 ? ((s.response_time_ms / sum) * 100).toFixed(0) : 0;
            const tone = toneFor(s);

            return (
              <li className="latency-row" key={`${s.step}-${i}`}>
                {/* Step Metadata & Server */}
                <div className="latency-label-col">
                  <span className="latency-step-badge">#{s.step ?? i + 1}</span>
                  <span className={`latency-zone-pill zone-${tone}`}>
                    {labelFor(s)}
                  </span>
                  <span className="latency-server-host" title={s.server_name || s.server}>
                    {s.server_name || s.server}
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div className="latency-track-col">
                  <div className="latency-track" aria-hidden="true">
                    <div
                      className={`latency-bar bar-${tone}`}
                      style={{ width: `${pct}%`, "--idx": i }}
                    />
                  </div>
                </div>

                {/* Values & Percentage */}
                <div className="latency-val-col">
                  <span className="latency-ms-value">
                    {s.response_time_ms.toFixed(1)} <small>ms</small>
                  </span>
                  <span className="latency-share-badge">{share}%</span>
                  <span className={`latency-response-tag resp-${tone}`}>
                    {s.response}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="time-chart-footer">
        <span className="tc-note-icon">💡</span>
        <span>
          Measured using high-precision hardware timestamps (<code>perf_counter</code>) per UDP socket transaction. Shows real geographic and network routing propagation times.
        </span>
      </div>
    </section>
  );
}