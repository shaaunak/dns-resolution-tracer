import { useState } from "react";
import { clearCache } from "../services/api";

export default function CacheControls({ onCacheCleared }) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null); // { text, type }

  async function handleClear() {
    setBusy(true);
    setFeedback(null);
    try {
      const data = await clearCache();
      const count = typeof data.cleared === "number" ? data.cleared : 0;
      setFeedback({
        type: "ok",
        text: `Cache purged (${count} ${count === 1 ? "entry" : "entries"} evicted). Next query will traverse live root servers.`,
      });
      if (onCacheCleared) onCacheCleared();
    } catch {
      setFeedback({
        type: "err",
        text: "Could not purge cache. Verify the backend service is reachable.",
      });
    } finally {
      setBusy(false);
      setTimeout(() => {
        setFeedback((prev) => (prev?.type === "ok" ? null : prev));
      }, 4000);
    }
  }

  return (
    <div className="cache-ctrl-wrapper">
      <div className="cache-ctrl-actions">
        <button
          type="button"
          className="cache-purge-btn"
          onClick={handleClear}
          disabled={busy}
          title="Evicts in-memory cache to force a real recursive DNS trace on the next query"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span>{busy ? "Flushing Cache..." : "Purge App Cache"}</span>
        </button>

        <span className="cache-ctrl-hint">
          Simulate cold vs warm resolver performance
        </span>
      </div>

      {feedback && (
        <div className={`cache-ctrl-toast ${feedback.type}`} role="status">
          <span className="toast-dot" />
          <span>{feedback.text}</span>
        </div>
      )}
    </div>
  );
}
