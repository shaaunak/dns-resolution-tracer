import { useEffect, useState } from "react";
import { getHealth } from "../services/api";

const LABELS = {
  checking: "Checking backend...",
  online: "Backend online",
  offline: "Backend offline",
};

export default function Header() {
  const [status, setStatus] = useState("checking");

  // Real call to GET /api/health; nothing here is simulated.
  useEffect(() => {
    let alive = true;
    getHealth()
      .then(() => alive && setStatus("online"))
      .catch(() => alive && setStatus("offline"));
    return () => {
      alive = false;
    };
  }, []);

  function recheck() {
    setStatus("checking");
    getHealth()
      .then(() => setStatus("online"))
      .catch(() => setStatus("offline"));
  }

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">D</span>
        <span>DNS TRACER</span>
      </div>
      <button
        type="button"
        className="status-pill"
        data-state={status}
        onClick={recheck}
        title="Click to re-check the backend"
        aria-live="polite"
      >
        <span className="dot" aria-hidden="true" />
        {LABELS[status]}
      </button>
    </header>
  );
}
