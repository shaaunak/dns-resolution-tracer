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
  if (r === "CNAME") return "violet";
  return "accent";
}

function labelFor(step) {
  if (step.sub_resolution) return "NS LOOKUP";
  if (!step.server_type || step.server_type === "UNKNOWN") return "SERVER";
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
    <div className="card">
      <div className="section-title">Time per query</div>
      <ul className="tc-list">
        {rows.map((s, i) => {
          const pct = Math.max((s.response_time_ms / max) * 100, 1.5);
          return (
            <li className="tc-row" key={`${s.step}-${i}`}>
              <div className="tc-label">
                <span className="tc-num">{s.step ?? i + 1}</span>
                <span className="tc-type">{labelFor(s)}</span>
                <span className="tc-name">{s.server_name || s.server}</span>
              </div>
              <div className="tc-track" aria-hidden="true">
                <div
                  className={`tc-bar tc-${toneFor(s)}`}
                  style={{ width: `${pct}%`, "--i": i }}
                />
              </div>
              <div className="tc-val">
                {s.response_time_ms.toFixed(1)} ms
                <span className="tc-resp"> {s.response}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="tc-note">
        Sum of query times: {sum.toFixed(1)} ms. The total time shown above can
        be slightly higher because it also includes small processing overhead.
      </p>
    </div>
  );
}