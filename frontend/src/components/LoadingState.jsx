import { useEffect, useState } from "react";

export const STAGES = ["YOU", "ROOT", "TLD", "AUTHORITATIVE", "FINAL ANSWER"];

// Shown while the real POST /api/trace request is in flight.
// A single HTTP request cannot report progress per server, so this does NOT
// pretend that individual servers have been queried. The timer is real elapsed time.
export default function LoadingState({ domain, recordType }) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => setElapsedMs(performance.now() - start), 100);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="card" aria-busy="true" aria-labelledby="loading-title">
      <h2 id="loading-title" className="section-title">Resolution Path</h2>

      <p className="loading-line" role="status">
        <span className="spinner" aria-hidden="true" />
        <span>
          Resolving <strong>{domain}</strong> ({recordType})...
        </span>
      </p>

      <ol className="path" aria-hidden="true">
        {STAGES.map((name) => (
          <li key={name} className="path-node shimmer">{name}</li>
        ))}
      </ol>

      <p className="empty-note">
        Sending real DNS queries. Elapsed: {(elapsedMs / 1000).toFixed(1)} s
      </p>
      {elapsedMs > 3000 && (
        <p className="empty-note">
          Still waiting. A DNS server may not be answering (each attempt times out after 3 s);
          the resolver will try another server.
        </p>
      )}
    </section>
  );
}
