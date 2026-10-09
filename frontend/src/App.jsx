import { useEffect, useRef, useState } from "react";
import { getHealth, traceDomain, clearCache } from "./services/api";
import { ROOT_SERVERS } from "./constants/rootServers";
import "./index.css";

const RECORD_TYPES = [
  { value: "A", label: "A (IPv4)" },
  { value: "AAAA", label: "AAAA (IPv6)" },
  { value: "CNAME", label: "CNAME" },
  { value: "NS", label: "NS" },
  { value: "MX", label: "MX" },
  { value: "TXT", label: "TXT" },
];

const PRESETS = [
  { domain: "google.com", type: "A", label: "google.com" },
  { domain: "cloudflare.com", type: "AAAA", label: "cloudflare.com" },
  { domain: "www.bbc.co.uk", type: "A", label: "bbc.co.uk" },
  { domain: "github.com", type: "MX", label: "github.com" },
  { domain: "fake-host-987123.xyz", type: "A", label: "fake-host.xyz" },
];

export default function App() {
  const [phase, setPhase] = useState("idle"); // idle | loading | done | failed
  const [request, setRequest] = useState(null);
  const [result, setResult] = useState(null);
  const [baselineMs, setBaselineMs] = useState(null);
  const [failure, setFailure] = useState(null);
  const [history, setHistory] = useState([]);
  const [highlightedStep, setHighlightedStep] = useState(null);
  const [hoveredHopIndex, setHoveredHopIndex] = useState(null);
  const [selectedRootServer, setSelectedRootServer] = useState(ROOT_SERVERS[0]);

  // Engine telemetry from /api/health
  const [engineHealth, setEngineHealth] = useState({ status: "checking", hits: 0, misses: 0, entries: 0 });
  const [toastMsg, setToastMsg] = useState(null);

  // Input states
  const [domainInput, setDomainInput] = useState("");
  const [recordType, setRecordType] = useState("A");

  const networkTimes = useRef(new Map());
  const consoleSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);
  const rootClustersRef = useRef(null);
  const toastTimer = useRef(null);
  const historyCounterRef = useRef(0);

  // Reset scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch health and cache stats
  const refreshHealth = async () => {
    try {
      const data = await getHealth();
      setEngineHealth({
        status: "online",
        hits: data.cache?.hits ?? 0,
        misses: data.cache?.misses ?? 0,
        entries: data.cache?.entries ?? 0,
      });
    } catch {
      setEngineHealth((prev) => ({ ...prev, status: "offline" }));
    }
  };

  useEffect(() => {
    let active = true;
    getHealth()
      .then((data) => {
        if (active) {
          setEngineHealth({
            status: "online",
            hits: data.cache?.hits ?? 0,
            misses: data.cache?.misses ?? 0,
            entries: data.cache?.entries ?? 0,
          });
        }
      })
      .catch(() => {
        if (active) setEngineHealth((prev) => ({ ...prev, status: "offline" }));
      });
    const id = setInterval(refreshHealth, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const triggerToast = (msg) => {
    clearTimeout(toastTimer.current);
    setToastMsg(msg);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3500);
  };

  // Run Trace
  const handleTrace = async (domainToTrace = domainInput, typeToTrace = recordType) => {
    const cleaned = String(domainToTrace || "").trim();
    if (!cleaned) {
      triggerToast("Please enter a domain name to trace.");
      return;
    }

    setDomainInput(cleaned);
    setRecordType(typeToTrace);
    setRequest({ domain: cleaned, recordType: typeToTrace });
    setPhase("loading");
    setResult(null);
    setFailure(null);
    setHighlightedStep(null);
    setHoveredHopIndex(null);

    try {
      const data = await traceDomain(cleaned, typeToTrace);
      const key = `${data.domain}|${data.record_type}`;

      let baseline = null;
      if (data.cache_hit) {
        baseline = networkTimes.current.get(key) ?? null;
      } else if (!data.error && data.steps.length > 0) {
        networkTimes.current.set(key, data.total_time_ms);
      }

      setBaselineMs(baseline);
      setResult(data);
      setPhase("done");

      // Refresh cache counters from backend
      refreshHealth();

      // Add to session history
      const entryId = `hist-${++historyCounterRef.current}-${data.domain}-${data.record_type}`;
      const entry = {
        id: entryId,
        domain: data.domain,
        recordType: data.record_type,
        cacheHit: Boolean(data.cache_hit),
        errorCode: data.error?.code ?? null,
        ms: data.total_time_ms,
      };
      setHistory((prev) => [
        entry,
        ...prev.filter((h) => !(h.domain === entry.domain && h.recordType === entry.recordType)),
      ].slice(0, 8));

      // Scroll down to results
      setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 140);
    } catch (err) {
      setFailure({ code: err.code ?? "BAD_RESPONSE", message: err.message });
      setPhase("failed");
      refreshHealth();
    }
  };

  // Clear Application Cache
  const handlePurgeCache = async () => {
    try {
      const res = await clearCache();
      const count = typeof res.cleared === "number" ? res.cleared : 0;
      triggerToast(`Application cache purged (${count} records evicted).`);
      refreshHealth();
      if (result) {
        networkTimes.current.delete(`${result.domain}|${result.record_type}`);
      }
    } catch {
      triggerToast("Could not purge cache. Is the backend service online?");
    }
  };

  const handlePurgeAndRetrace = async () => {
    await handlePurgeCache();
    if (result) {
      handleTrace(result.domain, result.record_type);
    }
  };

  const handleFocusStep = (stepNum) => {
    setHighlightedStep(stepNum);
    const el = document.getElementById(`step-card-${stepNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      triggerToast(`${label} copied to clipboard.`);
    }).catch(() => {});
  };

  // Derived metrics
  const queries = result ? (result.steps || []).filter((s) => !s.cache_hit) : [];
  const avgQueryMs = queries.length > 0
    ? queries.reduce((t, s) => t + (s.response_time_ms ?? 0), 0) / queries.length
    : 0;
  const lastStep = queries[queries.length - 1];
  const isAuthoritative = lastStep?.authoritative === true;

  // Maximum latency for waterfall scaling
  const maxQueryMs = queries.length > 0
    ? Math.max(...queries.map((q) => q.response_time_ms ?? 1), 1)
    : 1;

  return (
    <div className="min-h-screen bg-[#fcfbf8] text-[#001011]">
      {/* ====================================================================
          NAVIGATION APP BAR ((dot)connect Architecture)
          ==================================================================== */}
      <header className="dot-navbar">
        <a
          href="#"
          className="nav-brand-group"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <div className="brand-dot-mark" />
          <span className="brand-logotype">DNS·TRACER</span>
          <span className="brand-standard-tag">RFC 1034 / 1035</span>
        </a>

        <nav className="nav-links-center">
          <button
            type="button"
            className="nav-link-btn"
            onClick={() => consoleSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            Diagnostic Console
          </button>
          {result && (
            <button
              type="button"
              className="nav-link-btn font-semibold text-[#fd5321]"
              onClick={() => resultsSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              Results
            </button>
          )}
          <button
            type="button"
            className="nav-link-btn"
            onClick={() => rootClustersRef.current?.scrollIntoView({ behavior: "smooth" })}
          >
            Root Clusters
          </button>
        </nav>

        <div className="nav-right-actions">
          {/* Live Cache Stats */}
          <div className="nav-cache-pill hidden sm:inline-flex">
            <span>Cache:</span>
            <strong>{engineHealth.hits} Hits</strong>
            <span className="text-[#c1c4c2]">/</span>
            <span>{engineHealth.misses} Misses</span>
            <span className="text-[#717674]">({engineHealth.entries})</span>
          </div>

          {/* Engine Status Pip */}
          <button
            type="button"
            className="nav-engine-status"
            onClick={refreshHealth}
            title="Click to ping resolver engine"
          >
            <span className={`engine-status-pip ${engineHealth.status}`} />
            <span className="tabular-nums">
              {engineHealth.status === "online" ? "Engine 200 OK" : engineHealth.status === "offline" ? "Offline" : "Checking"}
            </span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          PAGE CONTAINER
          ==================================================================== */}
      <main className="page-wrapper">
        {/* ==================================================================
            HERO SECTION: Massive Swiss Typography + 3D Kinetic Sculpture
            ================================================================== */}
        <section className="hero-editorial">
          <div className="hero-classification">
            <span className="hero-classification-dot" />
            <span>Computer Networks Engineering Blueprint</span>
          </div>

          <h1 className="hero-display-title">
            MAP THE INVISIBLE <span className="ember-highlight">TOPOLOGY</span> OF THE WEB
          </h1>

          <p className="hero-lead-text">
            An iterative RFC 1034 / 1035 resolver tracking every socket from the Root anycast
            clusters through Top-Level Domain registries down to Authoritative zone owners.
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="arrow-pill-btn"
              onClick={() => consoleSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              <span className="arrow-pill-circle">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
              <span>Start Diagnostic</span>
            </button>

            <button
              type="button"
              className="ghost-pill-btn"
              onClick={() => rootClustersRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              <span>Root Clusters Reference ↓</span>
            </button>
          </div>
        </section>


        {/* ==================================================================
            SECTION 01: DIAGNOSTIC SEARCH CONSOLE
            ================================================================== */}
        <section ref={consoleSectionRef} className="console-blueprint-panel">
          <div className="section-blueprint-header mb-0">
            <div className="section-header-left">
              <div className="circular-arrow-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
              <span className="section-title-text">Diagnostic Query Console</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="ghost-pill-btn h-9 px-4 text-xs font-mono"
                onClick={handlePurgeCache}
                title="Evicts local in-memory records"
              >
                Purge RAM Cache
              </button>
              <span className="section-index-counter">(01)</span>
            </div>
          </div>

          <div className="console-heading-block">
            <h2>Enter Target Hostname</h2>
            <p>Execute an iterative query through Root, TLD, and Authoritative DNS sockets</p>
          </div>

          {/* Search Input Bar */}
          <form
            className="console-input-cluster"
            onSubmit={(e) => {
              e.preventDefault();
              handleTrace(domainInput, recordType);
            }}
          >
            <div className="console-input-shell">
              <span className="console-protocol-prefix">tracer://</span>
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="domain name e.g. google.com, cloudflare.com, bbc.co.uk..."
                autoComplete="off"
                spellCheck={false}
                className="console-text-input"
              />
            </div>

            {/* Segmented Record Type Selector */}
            <div className="record-segmented-strip">
              {RECORD_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`record-segment-opt ${recordType === t.value ? "selected" : ""}`}
                  onClick={() => setRecordType(t.value)}
                >
                  {t.value}
                </button>
              ))}
            </div>

            {/* (dot)connect EMBER CTA BUTTON */}
            <button
              type="submit"
              className="ember-cta-btn"
              disabled={phase === "loading"}
            >
              {phase === "loading" ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Resolving...</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Run Trace</span>
                </>
              )}
            </button>
          </form>

          {/* Presets & Recent History */}
          <div className="console-sub-bar">
            <div className="presets-container">
              <span className="presets-label">Presets:</span>
              {PRESETS.map((p) => (
                <button
                  key={`${p.domain}-${p.type}`}
                  type="button"
                  className="preset-blueprint-pill"
                  onClick={() => {
                    setDomainInput(p.domain);
                    setRecordType(p.type);
                    handleTrace(p.domain, p.type);
                  }}
                  disabled={phase === "loading"}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {history.length > 0 && (
              <div className="history-strip">
                <span className="presets-label">Recent:</span>
                {history.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    className="history-pill"
                    onClick={() => {
                      setDomainInput(h.domain);
                      setRecordType(h.recordType);
                      handleTrace(h.domain, h.recordType);
                    }}
                  >
                    <span>{h.domain}</span>
                    <span className="text-[#fd5321] text-[10.5px]">[{h.recordType}]</span>
                    <span className={`text-[10.5px] ${h.cacheHit ? "text-[#10b981] font-semibold" : "text-[#717674]"}`}>
                      {h.cacheHit ? "HIT" : `${h.ms?.toFixed(0)}ms`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ==================================================================
            IN-FLIGHT QUERY STATUS
            ================================================================== */}
        {phase === "loading" && request && (
          <div className="p-10 bg-[#ededea] border border-[#c1c4c2] rounded-[20px] flex flex-col items-center justify-center text-center font-mono">
            <div className="w-8 h-8 rounded-full border-2 border-[#001011]/20 border-t-[#fd5321] animate-spin mb-3" />
            <div className="text-xs text-[#fd5321] uppercase tracking-wider font-semibold">
              Traversing Iterative Nameserver Chain
            </div>
            <div className="text-lg font-semibold text-[#001011] mt-1">
              Resolving {request.domain} <span className="text-[#fd5321]">[{request.recordType}]</span>
            </div>
            <div className="text-xs text-[#717674] mt-1">
              Querying Root `.` servers → TLD registry → Authoritative nameservers over UDP port 53
            </div>
          </div>
        )}

        {/* ==================================================================
            RESOLUTION FAILURE
            ================================================================== */}
        {phase === "failed" && failure && (
          <div className="p-8 bg-[#ededea] border border-[#f43f5e] rounded-[20px] font-mono">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#f43f5e]/15 text-[#f43f5e] text-xs font-semibold border border-[#f43f5e]/30">
                {failure.code}
              </span>
              <h3 className="text-base font-semibold text-[#001011]">Resolution Exception</h3>
            </div>
            <p className="text-sm text-[#0f1e1f] mt-2">{failure.message}</p>
          </div>
        )}

        {/* ==================================================================
            SECTION 02: TRACE RESULTS & SYSTEM TELEMETRY
            ================================================================== */}
        {phase === "done" && result && (
          <div ref={resultsSectionRef} className="flex flex-col gap-12">
            {/* Cache Transparency Strip */}
            <div className={`cache-banner-blueprint ${result.cache_hit ? "is-hit" : "is-miss"}`}>
              <div className="cache-content-left">
                <span className="cache-outcome-tag">
                  {result.cache_hit ? "Warm RAM Cache Hit" : "Cold Network Cache Miss"}
                </span>

                <div className="cache-description-text">
                  {result.cache_hit ? (
                    <>
                      <strong>Intercepted from local application memory.</strong> Remote sockets bypassed (0 network queries). Total round-trip:{" "}
                      <strong>{result.total_time_ms.toFixed(1)} ms</strong>. TTL remaining:{" "}
                      <strong>{result.ttl}s</strong>.
                    </>
                  ) : (
                    <>
                      <strong>Iterative network resolution completed.</strong> Queried Root → TLD → Authoritative servers. Total round-trip:{" "}
                      <strong>{result.total_time_ms.toFixed(1)} ms</strong>. Cached with TTL{" "}
                      <strong>{result.ttl ?? 300}s</strong>.
                    </>
                  )}
                </div>
              </div>

              <div>
                {result.cache_hit ? (
                  <button
                    type="button"
                    className="ghost-pill-btn h-10 px-5 text-xs font-mono"
                    onClick={handlePurgeAndRetrace}
                    title="Purge RAM cache and run cold network query"
                  >
                    Purge & Retrace Cold
                  </button>
                ) : (
                  <button
                    type="button"
                    className="arrow-pill-btn h-10 px-4 text-xs font-mono"
                    onClick={() => handleTrace(result.domain, result.record_type)}
                    title="Run identical query again to test cache hit"
                  >
                    <span className="arrow-pill-circle w-6 h-6">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </span>
                    <span>Re-query to Test Hit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Segmented Telemetry Strip */}
            <div>
              <div className="section-blueprint-header">
                <div className="section-header-left">
                  <div className="circular-arrow-badge">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                  </div>
                  <span className="section-title-text">Resolution Instrument Telemetry</span>
                </div>
                <span className="section-index-counter">(02)</span>
              </div>

              <div className="telemetry-grid-strip">
                <div className="telemetry-cell">
                  <span className="telemetry-label">Total Latency</span>
                  <div className="telemetry-value tabular-nums">
                    {result.total_time_ms.toFixed(1)}
                    <span className="text-xs font-normal text-[#717674] ml-1">ms</span>
                  </div>
                  <span className="telemetry-subtext">
                    {result.cache_hit ? "Local RAM retrieval" : `Avg hop: ${avgQueryMs.toFixed(1)} ms`}
                  </span>
                </div>

                <div className="telemetry-cell">
                  <span className="telemetry-label">DNS Hops</span>
                  <div className="telemetry-value tabular-nums">
                    {result.cache_hit ? "00 Cached" : `${String(queries.length).padStart(2, "0")} Iterative`}
                  </div>
                  <span className="telemetry-subtext">
                    {result.cache_hit ? "Sockets bypassed" : "Root → TLD → Auth"}
                  </span>
                </div>

                <div className="telemetry-cell">
                  <span className="telemetry-label">Avg Query</span>
                  <div className="telemetry-value tabular-nums">
                    {result.cache_hit ? "0.0" : avgQueryMs.toFixed(1)}
                    <span className="text-xs font-normal text-[#717674] ml-1">ms</span>
                  </div>
                  <span className="telemetry-subtext">
                    {result.cache_hit ? "RAM lookup" : `${queries.length} network socket(s)`}
                  </span>
                </div>

                <div className="telemetry-cell">
                  <span className="telemetry-label">Cache Outcome</span>
                  <div className="telemetry-value text-base font-semibold">
                    <span className={result.cache_hit ? "text-[#10b981]" : "text-[#fd5321]"}>
                      {result.cache_hit ? "WARM HIT" : "COLD MISS"}
                    </span>
                  </div>
                  <span className="telemetry-subtext">
                    {result.cache_hit ? `${baselineMs ? `${(baselineMs / Math.max(result.total_time_ms, 0.05)).toFixed(0)}x speedup` : "Memory hit"}` : "Stored to LRU cache"}
                  </span>
                </div>

                <div className="telemetry-cell">
                  <span className="telemetry-label">Authority Flag</span>
                  <div className="telemetry-value text-base font-semibold">
                    <span className={isAuthoritative || result.cache_hit ? "text-[#10b981]" : "text-[#717674]"}>
                      {result.cache_hit ? "CACHED" : isAuthoritative ? "AA=TRUE" : "DELEGATED"}
                    </span>
                  </div>
                  <span className="telemetry-subtext">
                    {isAuthoritative ? "Zone owner" : "Referral traversal"}
                  </span>
                </div>

                <div className="telemetry-cell">
                  <span className="telemetry-label">Zone TTL</span>
                  <div className="telemetry-value tabular-nums text-[#fd5321]">
                    {result.ttl != null ? `${result.ttl}s` : "—"}
                  </div>
                  <span className="telemetry-subtext">
                    {result.ttl != null ? `Expires in ${Math.round(result.ttl / 60)} min` : "No TTL record"}
                  </span>
                </div>
              </div>
            </div>

            {/* ==============================================================
                RESOLUTION RAIL (Central Connecting Hairline)
                ============================================================== */}
            <div className="resolution-rail-container">
              <div className="rail-legend-row">
                <div>
                  <div className="text-xs font-mono font-semibold text-[#fd5321] uppercase tracking-wider">
                    Resolution Pipeline Rail
                  </div>
                  <h3 className="text-base font-semibold text-[#001011] mt-0.5">
                    Physical Traversal Chain · Live Wire Trace
                  </h3>
                </div>
                <div className="rail-legend-pills">
                  <span className="flex items-center gap-1.5"><span className="legend-dot client" /> Client</span>
                  <span className="flex items-center gap-1.5"><span className="legend-dot root" /> Root `.`</span>
                  <span className="flex items-center gap-1.5"><span className="legend-dot tld" /> TLD</span>
                  <span className="flex items-center gap-1.5"><span className="legend-dot auth" /> Authoritative</span>
                </div>
              </div>

              <div className="rail-scroll-lane">
                {/* SVG Connecting Rail */}
                <svg className="svg-blueprint-rail" width="100%" height="20" preserveAspectRatio="none">
                  <line x1="0" y1="10" x2="100%" y2="10" className="blueprint-rail-base" />
                  <line x1="0" y1="10" x2="100%" y2="10" className="blueprint-rail-pulse" />
                  {hoveredHopIndex !== null && (
                    <line x1="0" y1="10" x2="100%" y2="10" stroke="#fd5321" strokeWidth="2.5" />
                  )}
                </svg>

                <ol className="rail-nodes-track">
                  {/* Hop 0: Client Local Resolver */}
                  <li>
                    <div
                      className={`blueprint-node-card zone-client ${hoveredHopIndex === 0 ? "focused" : ""}`}
                      onMouseEnter={() => setHoveredHopIndex(0)}
                      onMouseLeave={() => setHoveredHopIndex(null)}
                    >
                      <div className="node-top-meta">
                        <div className="node-zone-label">
                          <span className="node-zone-pip" />
                          <span>Client</span>
                        </div>
                        <span className="node-hop-id">HOP 00</span>
                      </div>
                      <div className="node-host-title">Local Stub Resolver</div>
                      <div className="node-address-text">127.0.0.1 (Localhost)</div>
                      <div className="node-bottom-row">
                        <span className="node-response-tag">QUERY</span>
                        <span className="node-latency-bracket">[ 0.0ms ]</span>
                      </div>
                    </div>
                  </li>

                  {/* Cache Bypass Node OR Remote Hop Modules */}
                  {result.cache_hit ? (
                    <li>
                      <div
                        className={`blueprint-node-card zone-cache ${hoveredHopIndex === 1 ? "focused" : ""}`}
                        onMouseEnter={() => setHoveredHopIndex(1)}
                        onMouseLeave={() => setHoveredHopIndex(null)}
                      >
                        <div className="node-top-meta">
                          <div className="node-zone-label">
                            <span className="node-zone-pip" />
                            <span>RAM Cache</span>
                          </div>
                          <span className="node-hop-id">INTERCEPT</span>
                        </div>
                        <div className="node-host-title">Application Memory</div>
                        <div className="node-address-text">LRU RAM Cache</div>
                        <div className="node-bottom-row">
                          <span className="node-response-tag text-[#10b981]">CACHE_HIT</span>
                          <span className="node-latency-bracket">[ 0.0ms ]</span>
                        </div>
                      </div>
                    </li>
                  ) : (
                    result.steps.map((step, idx) => {
                      const zoneClass =
                        step.server_type === "ROOT"
                          ? "zone-root"
                          : step.server_type === "TLD"
                          ? "zone-tld"
                          : step.server_type === "AUTHORITATIVE"
                          ? "zone-auth"
                          : "zone-client";

                      const hopNumber = idx + 1;

                      return (
                        <li key={step.step}>
                          <div
                            className={`blueprint-node-card ${zoneClass} ${hoveredHopIndex === hopNumber ? "focused" : ""}`}
                            onMouseEnter={() => setHoveredHopIndex(hopNumber)}
                            onMouseLeave={() => setHoveredHopIndex(null)}
                            onClick={() => handleFocusStep(step.step)}
                            title="Click to view wire packet breakdown below"
                          >
                            <div className="node-top-meta">
                              <div className="node-zone-label">
                                <span className="node-zone-pip" />
                                <span>{step.sub_resolution ? "GLUE NS" : step.server_type}</span>
                              </div>
                              <span className="node-hop-id">HOP {String(step.step).padStart(2, "0")}</span>
                            </div>
                            <div className="node-host-title" title={step.server_name || step.server}>
                              {step.server_name || step.server}
                            </div>
                            <div className="node-address-text">{step.server}</div>
                            <div className="node-bottom-row">
                              <span className="node-response-tag">[{step.response}]</span>
                              <span className="node-latency-bracket">
                                [ {step.response_time_ms ? `${step.response_time_ms.toFixed(1)}ms` : "0.0ms"} ]
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })
                  )}

                  {/* Terminal Node: Target Resolution or Error */}
                  <li>
                    <div
                      className={`blueprint-node-card ${result.error ? "zone-error" : "zone-auth"} ${hoveredHopIndex === 999 ? "focused" : ""}`}
                      onMouseEnter={() => setHoveredHopIndex(999)}
                      onMouseLeave={() => setHoveredHopIndex(null)}
                    >
                      <div className="node-top-meta">
                        <div className="node-zone-label">
                          <span className="node-zone-pip" />
                          <span>{result.error ? "ERROR" : "RESOLVED"}</span>
                        </div>
                        <span className="node-hop-id">TARGET</span>
                      </div>
                      <div className="node-host-title">
                        {result.error ? result.error.code : (result.final_answer[0]?.value || "Resolved")}
                      </div>
                      <div className="node-address-text">
                        {result.error ? result.error.message : `${result.final_answer.length} resource record(s)`}
                      </div>
                      <div className="node-bottom-row">
                        <span className={`node-response-tag ${result.error ? "text-[#f43f5e]" : "text-[#10b981]"}`}>
                          {result.error ? "FAIL" : "NOERROR"}
                        </span>
                        <span className="node-latency-bracket">
                          [ {result.total_time_ms.toFixed(1)}ms ]
                        </span>
                      </div>
                    </div>
                  </li>
                </ol>
              </div>
            </div>

            {/* ==============================================================
                OSCILLOSCOPE WATERFALL (Round-Trip Latency per Hop)
                ============================================================== */}
            {queries.length > 0 && (
              <div className="oscilloscope-blueprint-panel">
                <div className="oscilloscope-header-row">
                  <div>
                    <div className="text-xs font-mono font-semibold text-[#fd5321] uppercase tracking-wider">
                      Oscilloscope Latency Profile
                    </div>
                    <h3 className="text-base font-semibold text-[#001011] mt-0.5">
                      Round-Trip Time per Nameserver Hop
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-[#717674]">
                    Cumulative Network Latency:{" "}
                    <strong className="text-[#001011] font-semibold">
                      {queries.reduce((t, s) => t + (s.response_time_ms ?? 0), 0).toFixed(1)} ms
                    </strong>
                  </span>
                </div>

                <div className="osc-axis-header">
                  <span>NAMESERVER HOP</span>
                  <div className="osc-ticks-bar">
                    <span>0.0 ms</span>
                    <span>{(maxQueryMs * 0.25).toFixed(1)} ms</span>
                    <span>{(maxQueryMs * 0.5).toFixed(1)} ms</span>
                    <span>{(maxQueryMs * 0.75).toFixed(1)} ms</span>
                    <span>{maxQueryMs.toFixed(1)} ms</span>
                  </div>
                  <span className="text-right">RTT</span>
                </div>

                {queries.map((s, i) => {
                  const pct = Math.max(((s.response_time_ms ?? 0) / maxQueryMs) * 100, 2);
                  return (
                    <div className="osc-timeline-row" key={s.step}>
                      <div className="osc-server-col">
                        <span className="osc-hop-num">#{String(s.step).padStart(2, "0")}</span>
                        <span className="osc-server-name" title={s.server_name || s.server}>
                          {s.server_name || s.server}
                        </span>
                      </div>
                      <div className="osc-bar-channel">
                        <div
                          className="osc-bar-fill"
                          style={{ width: `${pct}%`, "--idx": i }}
                        />
                      </div>
                      <div className="osc-latency-label tabular-nums">
                        [ {s.response_time_ms?.toFixed(1)}ms ]
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ==============================================================
                ANSWER SECTION: Resolved Resource Records (RRset)
                ============================================================== */}
            {result.final_answer && result.final_answer.length > 0 && (
              <div className="blueprint-section-card">
                <div className="section-blueprint-header">
                  <div className="section-header-left">
                    <div className="circular-arrow-badge">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <span className="section-title-text">
                      Answer Section · Resolved Resource Records ({result.final_answer.length})
                    </span>
                  </div>
                  <span className="section-index-counter text-xs">[RRSET]</span>
                </div>

                <div className="blueprint-table-wrap">
                  <table className="blueprint-table">
                    <thead>
                      <tr>
                        <th>Domain Name</th>
                        <th>Type</th>
                        <th>TTL</th>
                        <th>Value / Target</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.final_answer.map((r, i) => (
                        <tr key={`${r.name}-${r.type}-${r.value}-${i}`}>
                          <td className="text-[#0f1e1f] font-mono">{r.name}</td>
                          <td>
                            <span className="rr-tag-chip">{r.type}</span>
                          </td>
                          <td className="text-[#fd5321] font-mono">{r.ttl}s</td>
                          <td className="font-semibold text-[#001011] font-mono break-all">{r.value}</td>
                          <td className="text-right">
                            <button
                              type="button"
                              className="copy-pill-action"
                              onClick={() => copyToClipboard(r.value, "Record value")}
                            >
                              Copy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==============================================================
                WIRE PROTOCOL BREAKDOWN (Deep Packet Inspector)
                ============================================================== */}
            <div className="blueprint-section-card">
              <div className="section-blueprint-header">
                <div className="section-header-left">
                  <div className="circular-arrow-badge">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <span className="section-title-text">
                    DNS Wire Message Breakdown ({result.steps.length} Hops)
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="copy-pill-action text-xs"
                    onClick={() => copyToClipboard(JSON.stringify(result, null, 2), "Full JSON")}
                  >
                    Copy JSON
                  </button>
                  <span className="section-index-counter text-xs">[WIRE]</span>
                </div>
              </div>

              <div className="hop-cards-flow">
                {result.steps.map((step) => (
                  <div
                    key={step.step}
                    id={`step-card-${step.step}`}
                    className={`wire-packet-box ${highlightedStep === step.step ? "border-[#fd5321]" : ""}`}
                  >
                    <div className="wire-packet-top">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-[#001011]">
                          STEP {String(step.step).padStart(2, "0")}
                        </span>
                        <span className="rr-tag-chip">
                          {step.cache_hit ? "LOCAL CACHE" : step.server_type}
                        </span>
                        <span className="text-xs text-[#717674] font-medium">
                          [{step.response}]
                        </span>
                      </div>
                      <span className="text-[#fd5321] font-semibold text-xs tabular-nums">
                        {step.cache_hit ? "0.0 ms" : `[ ${step.response_time_ms?.toFixed(1)} ms ]`}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mt-2 text-xs text-[#717674]">
                      <div>
                        <span className="mr-2">Nameserver:</span>
                        <strong className="text-[#001011]">{step.server_name || step.server}</strong>
                        {step.server_name && <span className="ml-2">({step.server})</span>}
                      </div>
                      <span>
                        {step.cache_hit ? "Memory Intercept" : `${step.transport || "UDP"}:53`}
                      </span>
                    </div>

                    <div className="packet-fields-grid">
                      <div className="packet-field-cell">
                        <div className="field-cell-label">Query Host</div>
                        <div className="field-cell-val">{step.query}</div>
                      </div>
                      <div className="packet-field-cell">
                        <div className="field-cell-label">Record Type</div>
                        <div className="field-cell-val text-[#fd5321]">{step.record_type}</div>
                      </div>
                      <div className="packet-field-cell">
                        <div className="field-cell-label">RCODE</div>
                        <div className="field-cell-val">{step.rcode ?? "NOERROR"}</div>
                      </div>
                      <div className="packet-field-cell">
                        <div className="field-cell-label">AA Flag</div>
                        <div className="field-cell-val">
                          {step.authoritative == null ? "—" : step.authoritative ? "True (Authoritative)" : "False (Referral)"}
                        </div>
                      </div>
                      <div className="packet-field-cell">
                        <div className="field-cell-label">Min TTL</div>
                        <div className="field-cell-val text-[#fd5321]">
                          {step.ttl != null ? `${step.ttl}s` : "—"}
                        </div>
                      </div>
                    </div>

                    {step.note && (
                      <div className="text-xs text-[#0f1e1f] bg-[#fcfbf8] border border-[#c1c4c2] p-3 rounded-[10px] mt-3">
                        {step.note}
                      </div>
                    )}

                    {step.authority && step.authority.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#c1c4c2]">
                        <div className="text-xs font-semibold text-[#717674] uppercase mb-2">
                          Delegated Authority Nameservers ({step.authority.length})
                        </div>
                        <div className="blueprint-table-wrap">
                          <table className="blueprint-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>TTL</th>
                                <th>Delegated Target</th>
                              </tr>
                            </thead>
                            <tbody>
                              {step.authority.map((r, i) => (
                                <tr key={`${r.name}-${r.value}-${i}`}>
                                  <td className="text-[#0f1e1f]">{r.name}</td>
                                  <td><span className="rr-tag-chip">{r.type}</span></td>
                                  <td className="text-[#fd5321]">{r.ttl}s</td>
                                  <td className="text-[#001011]">{r.value}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            SECTION 03: IANA ANYCAST ROOT CLUSTERS REFERENCE DOCK
            ================================================================== */}
        <section ref={rootClustersRef} className="bg-[#fcfbf8] border border-[#c1c4c2] rounded-[20px] p-6">
          <div className="section-blueprint-header mb-4 border-b border-[#c1c4c2] pb-4">
            <div className="section-header-left">
              <div className="circular-arrow-badge">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span className="section-title-text">IANA Anycast Root Clusters [a.root ... m.root]</span>
            </div>
            <span className="section-index-counter">(03)</span>
          </div>

          <div className="roots-cluster-strip flex-wrap mb-4">
            <span className="text-xs font-mono font-semibold text-[#717674] uppercase mr-1">13 Root Clusters:</span>
            {ROOT_SERVERS.map((srv) => (
              <button
                key={srv.id}
                type="button"
                className={`root-blueprint-chip ${selectedRootServer?.id === srv.id ? "active" : ""}`}
                onClick={() => {
                  setSelectedRootServer(srv);
                  triggerToast(`Root [${srv.id.toUpperCase()}]: ${srv.name} (${srv.operator})`);
                }}
                title={`${srv.name} — ${srv.operator} (${srv.ip})`}
              >
                {srv.id}.root
              </button>
            ))}
          </div>

          {selectedRootServer && (
            <div className="root-metadata-text pt-3 border-t border-[#c1c4c2]">
              <span>Selected Cluster: <strong>{selectedRootServer.name}</strong></span>
              <span className="text-[#c1c4c2]">/</span>
              <span>Operator: <strong>{selectedRootServer.operator}</strong></span>
              <span className="text-[#c1c4c2]">/</span>
              <span>IPv4: <strong>{selectedRootServer.ip}</strong></span>
              <span className="text-[#c1c4c2]">/</span>
              <span>Location: <strong>{selectedRootServer.loc}</strong></span>
            </div>
          )}
        </section>

        {/* Blueprint Footer */}
        <footer className="border-t border-[#c1c4c2] pt-10 pb-6 text-center font-mono text-xs text-[#717674]">
          DNS TRACER · RFC 1034 / 1035 Standards Compliance · Computer Networks Project · UDP Port 53
        </footer>
      </main>

      {/* Blueprint Toast */}
      {toastMsg && (
        <div className="blueprint-toast">
          <span className="w-2 h-2 rounded-full bg-[#fd5321]" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
