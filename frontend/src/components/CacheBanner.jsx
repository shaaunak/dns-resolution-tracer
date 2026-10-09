export default function CacheBanner({ result, baselineMs }) {
  const noLookup = result.steps.length === 0;
  const hit = result.cache_hit;
  const kind = noLookup ? "none" : hit ? "hit" : "miss";

  const fasterMultiplier =
    hit && baselineMs && result.total_time_ms > 0 && baselineMs > result.total_time_ms
      ? (baselineMs / Math.max(result.total_time_ms, 0.05)).toFixed(0)
      : null;

  return (
    <div className={`cache-telemetry-banner ${kind}`} role="status">
      <div className="cache-banner-left">
        <div className="cache-icon-box">
          {kind === "hit" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          ) : kind === "miss" ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          )}
        </div>

        <div className="cache-text-group">
          <div className="cache-status-header">
            <span className="cache-status-badge">
              {kind === "hit" && "WARM CACHE HIT"}
              {kind === "miss" && "COLD RESOLUTION (CACHE MISS)"}
              {kind === "none" && "PRE-FLIGHT VALIDATION"}
            </span>
            {fasterMultiplier && (
              <span className="speedup-tag">
                ⚡ ~{fasterMultiplier}x Faster than Network Trace
              </span>
            )}
          </div>

          <p className="cache-main-desc">
            {kind === "hit" &&
              "Resolved instantly from local in-memory application cache. Zero network packets sent to remote DNS nameservers."}
            {kind === "miss" &&
              "Queried live DNS hierarchy iteratively across root, TLD, and authoritative nameservers over UDP port 53."}
            {kind === "none" &&
              "Query halted before dispatching network sockets."}
          </p>

          <div className="cache-footer-meta">
            {kind === "hit" && result.ttl != null && (
              <span className="cache-meta-item">
                TTL Expiry: <strong>{result.ttl}s remaining</strong>
              </span>
            )}
            {fasterMultiplier && (
              <span className="cache-meta-item">
                Prior Network Trace: <strong>{baselineMs.toFixed(1)} ms</strong> → Cached: <strong>{result.total_time_ms.toFixed(1)} ms</strong>
              </span>
            )}
            <span className="cache-meta-sub">Application LRU Cache Layer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
