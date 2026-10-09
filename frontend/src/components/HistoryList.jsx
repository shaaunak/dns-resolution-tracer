import "./extras.css";

const WARN = new Set(["NXDOMAIN", "NODATA"]);

function describe(item) {
  if (item.errorCode) {
    return { label: item.errorCode, tone: WARN.has(item.errorCode) ? "warn" : "err" };
  }
  if (item.cacheHit) return { label: "CACHE HIT", tone: "ok" };
  return { label: "RESOLVED", tone: "ok" };
}

export default function HistoryList({ items, onRun, onClear, disabled }) {
  if (!items || items.length === 0) return null;

  return (
    <section className="history-bar-card" aria-labelledby="history-heading">
      <div className="history-bar-head">
        <div className="history-title-group">
          <span className="history-dot" />
          <h3 id="history-heading" className="history-title">Recent Traces</h3>
          <span className="history-count">({items.length})</span>
        </div>
        <button
          type="button"
          className="history-clear-link"
          onClick={onClear}
          title="Clear trace history session"
        >
          Clear History
        </button>
      </div>

      <div className="history-scroll-track">
        <ul className="history-items-list">
          {items.map((item) => {
            const d = describe(item);
            return (
              <li key={item.id} className="history-list-entry">
                <button
                  type="button"
                  className={`history-pill-btn tone-${d.tone}`}
                  disabled={disabled}
                  title={`Rerun DNS trace for ${item.domain} (${item.recordType})`}
                  onClick={() =>
                    onRun({ domain: item.domain, recordType: item.recordType })
                  }
                >
                  <span className="hist-domain">{item.domain}</span>
                  <span className="hist-type-chip">{item.recordType}</span>
                  <span className={`hist-status-tag ${d.tone}`}>{d.label}</span>
                  {typeof item.ms === "number" && (
                    <span className="hist-ms-tag">{item.ms.toFixed(0)}ms</span>
                  )}
                  <span className="hist-rerun-arrow">↻</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}