import { useEffect, useState } from "react";

const STAGES = [
  { id: "client", label: "Local Resolver", zone: "INIT" },
  { id: "root", label: "Root Server (.)", zone: "13 CLUSTERS" },
  { id: "tld", label: "TLD Registry", zone: "GTLD/CCTLD" },
  { id: "auth", label: "Authoritative", zone: "ZONE NS" },
  { id: "answer", label: "Resolved RRSet", zone: "FINAL" },
];

export default function LoadingState({ domain, recordType }) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => setElapsedMs(performance.now() - start), 50);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="loading-card" aria-busy="true" aria-labelledby="loading-heading">
      <div className="loading-head">
        <div className="loading-spinner-ring" />
        <div className="loading-title-group">
          <span className="loading-status-tag">Iterative Query In Flight</span>
          <h2 id="loading-heading" className="loading-title">
            Resolving <span className="loading-domain font-mono">{domain}</span> <span className="loading-type font-mono">{recordType}</span>
          </h2>
        </div>
        <div className="loading-timer">
          <span className="timer-val">{(elapsedMs / 1000).toFixed(2)}s</span>
          <span className="timer-label">Elapsed RTT</span>
        </div>
      </div>

      <div className="loading-stages-bar">
        {STAGES.map((stage, i) => (
          <div key={stage.id} className="loading-stage-item" style={{ "--stage-idx": i }}>
            <div className="loading-stage-indicator">
              <span className="loading-stage-dot" />
              <span className="loading-stage-line" />
            </div>
            <div className="loading-stage-text">
              <span className="stage-name">{stage.label}</span>
              <span className="stage-zone">{stage.zone}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="loading-footer">
        <div className="loading-pulse-indicator">
          <span className="pulse-dot" />
          <span>
            Dispatching UDP datagrams to root server network across port 53...
          </span>
        </div>
        {elapsedMs > 3000 && (
          <p className="loading-retry-note">
            Query latency elevated. One or more nameservers may be experiencing rate limits; engine is attempting secondary authoritative delegation...
          </p>
        )}
      </div>
    </section>
  );
}
