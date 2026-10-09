import { useEffect, useState } from "react";
import { getHealth } from "../services/api";

export default function Header({ onToggleInfoModal }) {
  const [status, setStatus] = useState("checking");
  const [latency, setLatency] = useState(null);

  function checkStatus() {
    setStatus("checking");
    const start = performance.now();
    getHealth()
      .then(() => {
        setLatency(Math.round(performance.now() - start));
        setStatus("online");
      })
      .catch(() => {
        setLatency(null);
        setStatus("offline");
      });
  }

  useEffect(() => {
    let active = true;
    const start = performance.now();
    getHealth()
      .then(() => {
        if (active) {
          setLatency(Math.round(performance.now() - start));
          setStatus("online");
        }
      })
      .catch(() => {
        if (active) {
          setLatency(null);
          setStatus("offline");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="topbar">
      <div className="brand-group">
        <div className="brand-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="3" />
            <circle cx="5" cy="19" r="3" />
            <circle cx="19" cy="19" r="3" />
            <path d="M12 8v4" />
            <path d="m7.5 16.5 2.5-3.5" />
            <path d="m16.5 16.5-2.5-3.5" />
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-title">
            <span>DNS</span>
            <span className="brand-accent">TRACER</span>
            <span className="brand-version">v2.4</span>
          </div>
          <span className="brand-sub">Iterative Resolver Engine</span>
        </div>
      </div>

      <div className="topbar-actions">
        {onToggleInfoModal && (
          <button
            type="button"
            className="topbar-btn"
            onClick={onToggleInfoModal}
            title="View DNS Protocol Reference Guide"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span>Protocol Guide</span>
          </button>
        )}

        <button
          type="button"
          className="status-pill"
          data-state={status}
          onClick={checkStatus}
          title="Backend health status. Click to re-ping API."
          aria-live="polite"
        >
          <span className="dot" aria-hidden="true" />
          <span className="status-label">
            {status === "checking" && "Connecting..."}
            {status === "online" && `Engine Online ${latency != null ? `· ${latency}ms` : ""}`}
            {status === "offline" && "Engine Offline"}
          </span>
        </button>
      </div>
    </header>
  );
}
