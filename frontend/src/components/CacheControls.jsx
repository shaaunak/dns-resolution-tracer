import { useState } from "react";
import { clearCache } from "../services/api";

export default function CacheControls() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function handleClear() {
    setBusy(true);
    setFailed(false);
    try {
      const data = await clearCache();
      setMessage(
        typeof data.cleared === "number"
          ? `Application cache cleared (${data.cleared} ${data.cleared === 1 ? "entry" : "entries"} removed). The next trace will be a cache miss.`
          : data.message ?? "Application cache cleared."
      );
    } catch {
      setFailed(true);
      setMessage("Could not clear the cache. Is the backend running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cache-controls">
      <button type="button" className="ghost-btn" onClick={handleClear} disabled={busy}>
        {busy ? "CLEARING..." : "CLEAR CACHE"}
      </button>
      {message && (
        <span role="status" className={failed ? "cc-msg err" : "cc-msg"}>{message}</span>
      )}
    </div>
  );
}
