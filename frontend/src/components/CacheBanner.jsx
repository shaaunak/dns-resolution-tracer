function Icon({ kind }) {
  if (kind === "hit") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
      </svg>
    );
  }
  if (kind === "miss") {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" />
      </svg>
    );
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M6 18 18 6" />
    </svg>
  );
}

export default function CacheBanner({ result, baselineMs }) {
  const noLookup = result.steps.length === 0; // rejected before any DNS query
  const hit = result.cache_hit;
  const kind = noLookup ? "none" : hit ? "hit" : "miss";

  const faster =
    hit && baselineMs && result.total_time_ms > 0 && baselineMs > result.total_time_ms
      ? baselineMs / result.total_time_ms
      : null;

  return (
    <div className={`cache-banner ${kind}`} role="status">
      <div className="cache-icon"><Icon kind={kind} /></div>
      <div className="cache-text">
        <div className="cache-title">
          {kind === "hit" && "CACHE HIT"}
          {kind === "miss" && "CACHE MISS"}
          {kind === "none" && "NO LOOKUP PERFORMED"}
        </div>

        {kind === "hit" && (
          <p>Answered from this application's own cache. No DNS query was sent.</p>
        )}
        {kind === "miss" && (
          <p>Not in this application's cache, so real DNS queries were sent over the network.</p>
        )}
        {kind === "none" && (
          <p>The request was rejected before any DNS query was sent.</p>
        )}

        {kind === "hit" && result.ttl != null && (
          <p className="cache-meta">Entry expires in {result.ttl} s</p>
        )}
        {faster && (
          <p className="cache-meta">
            Network trace took {baselineMs.toFixed(1)} ms; this lookup took{" "}
            {result.total_time_ms.toFixed(1)} ms ({faster.toFixed(0)}x faster)
          </p>
        )}
        <p className="cache-meta">This is our application's cache, not a DNS server's cache.</p>
      </div>
    </div>
  );
}
