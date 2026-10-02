import "./extras.css";

const WARN = new Set(["NXDOMAIN", "NODATA"]);

function describe(item) {
  if (item.errorCode) {
    return { label: item.errorCode, tone: WARN.has(item.errorCode) ? "warn" : "err" };
  }
  if (item.cacheHit) return { label: "HIT", tone: "ok" };
  return { label: "MISS", tone: "warn" };
}

export default function HistoryList({ items, onRun, onClear, disabled }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="card" aria-labelledby="history-title">
      <div className="history-head">
        <h2 id="history-title" className="section-title">
          Recent traces
        </h2>
        <button type="button" className="ghost-btn" onClick={onClear}>
          CLEAR HISTORY
        </button>
      </div>
      <ul className="history-list">
        {items.map((item) => {
          const d = describe(item);
          return (
            <li key={item.id}>
              <button
                type="button"
                className="history-item"
                disabled={disabled}
                title="Run this trace again"
                onClick={() =>
                  onRun({ domain: item.domain, recordType: item.recordType })
                }
              >
                <span>{item.domain}</span>
                <span className="chip">{item.recordType}</span>
                <span className={`history-out out-${d.tone}`}>{d.label}</span>
                {typeof item.ms === "number" && (
                  <span className="history-ms">{item.ms.toFixed(1)} ms</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}