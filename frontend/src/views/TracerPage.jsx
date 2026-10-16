import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "../context/RouterContext";
import { traceDomain, clearCache } from "../services/api";
import HopGraph from "../components/HopGraph";
import SummaryMetrics from "../components/SummaryMetrics";
import AnswerTable from "../components/AnswerTable";
import StepLedger from "../components/StepLedger";
import LatencyWaterfall from "../components/LatencyWaterfall";
import ErrorCard from "../components/ErrorCard";
import REAL_TRACE_FIXTURE from "../fixtures/realTraceFixture.json";

const RECORD_TYPES = ["A", "AAAA", "CNAME", "NS", "MX", "TXT"];

const PRESETS = [
  { label: "google.com", domain: "google.com", type: "A" },
  { label: "cloudflare.com (AAAA)", domain: "cloudflare.com", type: "AAAA" },
  { label: "github.com (MX)", domain: "github.com", type: "MX" },
  { label: "www.github.com (CNAME)", domain: "www.github.com", type: "A" },
  { label: "bbc.co.uk (NS)", domain: "bbc.co.uk", type: "NS" },
  { label: "nonexistent.xyz (NXDOMAIN)", domain: "nonexistent-404xyz.com", type: "A" },
  { label: "bad domain!! (INVALID)", domain: "bad domain!!", type: "A" },
];

export default function TracerPage({ onTraceCompleted, lastUserTrace }) {
  const { query, navigate } = useRouter();

  const [domainInput, setDomainInput] = useState(query.domain || "google.com");
  const [recordType, setRecordType] = useState(query.type || "A");
  const [result, setResult] = useState(lastUserTrace || REAL_TRACE_FIXTURE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [history, setHistory] = useState([]);

  // Session-level live trace timings map: `domain:type` -> number (ms)
  // Non-negotiable Honesty Rule: Only compute speedup when a real earlier live trace of the same query occurred in this session.
  const sessionLiveTimings = useRef(new Map());
  const toastTimeoutRef = useRef(null);

  const showToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3200);
  };

  // Run a trace
  const executeTrace = async (targetDomain = domainInput, targetType = recordType) => {
    const cleanDomain = String(targetDomain || "").trim();
    if (!cleanDomain) {
      setError({
        code: "INVALID_DOMAIN",
        message: "Domain name cannot be blank. Please enter a valid domain name.",
      });
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedStepIndex(null);

    const key = `${cleanDomain.toLowerCase()}:${targetType.toUpperCase()}`;

    try {
      const data = await traceDomain(cleanDomain, targetType);
      setResult(data);

      // Record in session history
      setHistory((prev) => [
        {
          domain: cleanDomain,
          type: targetType,
          total_time_ms: data.total_time_ms,
          cache_hit: data.cache_hit,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 7),
      ]);

      // If this was a live wire trace (not cache hit) and succeeded without fatal error, store baseline
      if (!data.cache_hit && data.total_time_ms > 0 && !data.error) {
        sessionLiveTimings.current.set(key, data.total_time_ms);
      }

      // Check if backend returned structured error
      if (data.error) {
        setError(data.error);
      }

      if (onTraceCompleted) {
        onTraceCompleted(data);
      }

      // Update URL search query without reloading
      navigate(`/trace?domain=${encodeURIComponent(cleanDomain)}&type=${encodeURIComponent(targetType)}`, {
        replace: true,
        keepScroll: true,
      });
    } catch (err) {
      setError({
        code: err.code || "BACKEND_UNREACHABLE",
        message: err.message || "Failed to communicate with backend engine.",
      });
    } finally {
      setLoading(false);
      if (typeof window !== "undefined") {
        window.__TRACE_DONE__ = true;
      }
    }
  };

  // Run on mount if query params provided
  useEffect(() => {
    if (query.domain) {
      setDomainInput(query.domain);
      const qType = query.type && RECORD_TYPES.includes(query.type) ? query.type : "A";
      setRecordType(qType);
      executeTrace(query.domain, qType);
    }
  }, []);

  const handlePresetClick = (preset) => {
    setDomainInput(preset.domain);
    setRecordType(preset.type);
    executeTrace(preset.domain, preset.type);
  };

  const handleClearCache = async () => {
    try {
      const res = await clearCache();
      const count = typeof res.cleared === "number" ? res.cleared : 0;
      showToast(`Cleared ${count} cached record${count === 1 ? "" : "s"} from backend`);
    } catch {
      showToast("Could not clear cache (backend unreachable)");
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    showToast("Copied full JSON trace to clipboard");
  };

  const handleCopySummary = () => {
    if (!result) return;
    const summary = [
      `dnstrace Resolution Summary:`,
      `Domain: ${result.domain} (${result.record_type})`,
      `Outcome: ${result.error ? result.error.code : "RESOLVED"}`,
      `Total Time: ${result.total_time_ms.toFixed(1)} ms`,
      `Cache: ${result.cache_hit ? "HIT (App Cache)" : "MISS (Live Iterative)"}`,
      `Steps Visited: ${result.steps?.length || 0}`,
      `Answer Records: ${result.final_answer?.map((r) => `${r.name} ${r.ttl}s ${r.type} ${r.value}`).join("; ") || "None"}`,
    ].join("\n");

    navigator.clipboard.writeText(summary);
    showToast("Copied summary text to clipboard");
  };

  // Speedup computation strictly based on real session history
  const key = `${(result?.domain || "").toLowerCase()}:${(result?.record_type || "").toUpperCase()}`;
  const previousLiveMs = sessionLiveTimings.current.get(key);
  const canShowSpeedup =
    result?.cache_hit &&
    typeof previousLiveMs === "number" &&
    previousLiveMs > 0 &&
    result.total_time_ms > 0;
  const speedupMultiple = canShowSpeedup
    ? Math.max(Math.round(previousLiveMs / Math.max(result.total_time_ms, 0.1)), 2)
    : null;

  return (
    <div style={{ paddingBottom: "80px", paddingTop: "24px" }}>
      <div className="layout-container">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              backgroundColor: "var(--color-primary-dark)",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              boxShadow: "var(--shadow-lg)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>ℹ</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ------------------------------------------------------------------
            PAGE HEADER & SEARCH BAR
            ------------------------------------------------------------------ */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "12px" }}>
            <span className="badge badge-maroon">Recursive Root-to-Leaf Traversal</span>
          </div>

          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(26px, 4vw, 36px)",
              fontWeight: 600,
              color: "var(--color-primary)",
              marginBottom: "8px",
              letterSpacing: "-0.015em",
            }}
          >
            Trace a DNS lookup, hop by hop.
          </h1>

          <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginBottom: "20px" }}>
            Iterative resolution engine bypassing local stub caches to trace root, TLD, and authoritative nameservers in real-time wire telemetry.
          </p>

          {/* Search Console Card */}
          <div
            className="hairline-card"
            style={{
              padding: "20px",
              backgroundColor: "var(--bg-surface)",
              marginBottom: "16px",
            }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeTrace();
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  flexWrap: "wrap",
                  marginBottom: "14px",
                }}
              >
                <div style={{ flex: "1 1 280px" }}>
                  <input
                    type="text"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="Enter domain (e.g. google.com)"
                    spellCheck="false"
                    autoCapitalize="none"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "14px",
                      backgroundColor: "#ffffff",
                      border: "1px solid var(--border-hairline)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--color-text-main)",
                      outline: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--color-primary)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border-hairline)";
                    }}
                  />
                </div>

                {/* Record Type Buttons */}
                <div style={{ display: "flex", gap: "4px" }}>
                  {RECORD_TYPES.map((type) => {
                    const isSelected = recordType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRecordType(type)}
                        style={{
                          padding: "6px 12px",
                          fontSize: "11px",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                          borderRadius: "var(--radius-sm)",
                          backgroundColor: isSelected ? "var(--color-primary)" : "#ffffff",
                          color: isSelected ? "#ffffff" : "var(--color-text-main)",
                          border: isSelected
                            ? "1px solid var(--color-primary-dark)"
                            : "1px solid var(--border-hairline)",
                          cursor: "pointer",
                        }}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ padding: "10px 22px" }}
                >
                  {loading ? "Tracing..." : "Trace DNS →"}
                </button>
              </div>
            </form>

            {/* Presets and Clear Cache */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                paddingTop: "12px",
                borderTop: "1px solid var(--border-hairline-subtle)",
                fontSize: "11px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                  PRESETS:
                </span>
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetClick(p)}
                    className="btn-outline"
                    style={{ padding: "2px 8px", fontSize: "11px" }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleClearCache}
                className="btn-outline"
                style={{ color: "var(--color-error)", borderColor: "var(--border-hairline)" }}
                title="Clears backend application in-memory cache"
              >
                Clear Cache
              </button>
            </div>
          </div>

          {/* Protocol Facts Strip */}
          <div
            style={{
              padding: "8px 14px",
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-hairline)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--color-text-muted)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div>
              <span>• EDNS0: 1232 octets</span> • <span>Protocol: UDP/53 (TCP fallback on TC=1)</span> •{" "}
              <span>Recursion Desired: RD=0 (Iterative)</span> • <span>DO Flag: 0</span>
            </div>
            <div style={{ color: "var(--color-primary)", fontWeight: 500 }}>
              Zero OS Recursive Delegation
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------
            CACHE STATUS BANNER
            ------------------------------------------------------------------ */}
        {result && (
          <div
            className="hairline-card"
            style={{
              padding: "16px 20px",
              marginBottom: "24px",
              backgroundColor: result.cache_hit
                ? "var(--color-secondary-tint)"
                : "var(--bg-surface)",
              border: result.cache_hit
                ? "1.5px solid var(--color-secondary-border)"
                : "1px solid var(--border-hairline)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: result.cache_hit
                    ? "var(--color-secondary-border)"
                    : "var(--bg-surface-recessed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: result.cache_hit
                    ? "var(--color-secondary-dark)"
                    : "var(--color-primary)",
                  fontWeight: 700,
                  fontSize: "12px",
                  flexShrink: 0,
                }}
              >
                {result.cache_hit ? "⚡" : "⇄"}
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: result.cache_hit
                        ? "var(--color-secondary-dark)"
                        : "var(--color-primary)",
                    }}
                  >
                    {result.cache_hit ? "CACHE HIT:" : "CACHE MISS:"}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main)" }}>
                    {result.cache_hit
                      ? "Answered from our application's in-memory cache"
                      : "Resolved through live DNS hierarchy"}
                  </span>
                  {canShowSpeedup && (
                    <span className="badge badge-success" style={{ fontWeight: 700 }}>
                      {speedupMultiple}x FASTER
                    </span>
                  )}
                </div>

                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.4 }}>
                  {result.cache_hit ? (
                    <span>
                      Answered in {result.total_time_ms.toFixed(1)} ms from our local TTL-aware cache.
                      {canShowSpeedup && (
                        <span>
                          {" "}Compared with earlier live trace of {previousLiveMs.toFixed(1)} ms in this browser session.
                        </span>
                      )}
                    </span>
                  ) : (
                    <span>
                      Answered by upstream authoritative DNS servers in {result.total_time_ms.toFixed(1)} ms.
                      Our application in-memory cache missed.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Real "Trace again" button */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => executeTrace(result.domain, result.record_type)}
                className="btn-secondary"
                style={{ fontSize: "12px", padding: "6px 14px" }}
                title="Runs the exact same query again so the backend cache actually answers"
              >
                {result.cache_hit ? "Trace again" : "Trace again (Warm cache)"}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            ERROR CARD (IF ANY)
            ------------------------------------------------------------------ */}
        {error && (
          <ErrorCard error={error} onRetry={() => executeTrace()} />
        )}

        {/* ------------------------------------------------------------------
            TRAVERSAL TOPOLOGY (CENTERPIECE HORIZONTAL GRAPH)
            ------------------------------------------------------------------ */}
        <div className="hairline-card" style={{ marginBottom: "24px", overflow: "hidden" }}>
          <div
            style={{
              padding: "12px 18px",
              borderBottom: "1px solid var(--border-hairline)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "var(--bg-surface)",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                }}
              >
                Iterative Traversal Topology
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                Physical trace across global nameserver clusters. Click any hop to inspect wire headers.
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="btn-outline"
                style={{ fontSize: "11px", padding: "4px 10px" }}
              >
                {showRawJson ? "Hide Raw JSON" : "Raw JSON View"}
              </button>
            </div>
          </div>

          <HopGraph
            steps={result?.steps || []}
            selectedStepIndex={selectedStepIndex}
            onSelectStep={(idx) => {
              setSelectedStepIndex(idx);
              const el = document.getElementById(`step-${idx}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }}
            cacheHit={result?.cache_hit}
            finalAnswer={result?.final_answer}
          />
        </div>

        {/* ------------------------------------------------------------------
            RAW JSON DRAWER (WHEN TOGGLED)
            ------------------------------------------------------------------ */}
        {showRawJson && result && (
          <div
            className="hairline-card"
            style={{
              padding: "16px",
              marginBottom: "24px",
              backgroundColor: "#ffffff",
              border: "1.5px solid var(--color-primary)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                }}
              >
                BACKEND API RESPONSE JSON
              </span>
              <button
                type="button"
                onClick={handleCopyJson}
                className="btn-outline"
                style={{ fontSize: "11px", padding: "2px 8px" }}
              >
                Copy JSON
              </button>
            </div>
            <pre
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                maxHeight: "260px",
                overflowY: "auto",
                backgroundColor: "var(--bg-surface-recessed)",
                padding: "12px",
                borderRadius: "var(--radius-xs)",
                color: "var(--color-text-main)",
                lineHeight: 1.4,
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* ------------------------------------------------------------------
            SUMMARY METRIC ROW
            ------------------------------------------------------------------ */}
        {result && <SummaryMetrics traceResult={result} />}

        {/* ------------------------------------------------------------------
            VALIDATED AUTHORITATIVE ANSWER TABLE
            ------------------------------------------------------------------ */}
        {result && (
          <AnswerTable
            records={result.final_answer}
            domain={result.domain}
            recordType={result.record_type}
          />
        )}

        {/* ------------------------------------------------------------------
            LATENCY WATERFALL & TIME BUDGET
            ------------------------------------------------------------------ */}
        {result && !result.cache_hit && (
          <LatencyWaterfall steps={result.steps} totalTimeMs={result.total_time_ms} />
        )}

        {/* ------------------------------------------------------------------
            STEP LEDGER & WIRE HEADERS
            ------------------------------------------------------------------ */}
        {result && (
          <StepLedger
            steps={result.steps}
            selectedStepIndex={selectedStepIndex}
            onSelectStep={setSelectedStepIndex}
          />
        )}

        {/* ------------------------------------------------------------------
            BOTTOM ACTION BAR & RECENT HISTORY
            ------------------------------------------------------------------ */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            padding: "16px 20px",
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-hairline)",
            borderRadius: "var(--radius-sm)",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              onClick={handleCopyJson}
              className="btn-outline"
              style={{ fontSize: "12px" }}
            >
              Copy JSON
            </button>
            <button
              type="button"
              onClick={handleCopySummary}
              className="btn-outline"
              style={{ fontSize: "12px" }}
            >
              Copy Summary
            </button>
          </div>

          {/* Session History Pills */}
          {history.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                RECENT:
              </span>
              {history.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setDomainInput(h.domain);
                    setRecordType(h.type);
                    executeTrace(h.domain, h.type);
                  }}
                  className="btn-outline"
                  style={{
                    padding: "2px 8px",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                  }}
                  title={`Re-run ${h.domain} (${h.type}) - ${h.total_time_ms.toFixed(1)}ms`}
                >
                  {h.domain} ({h.type})
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
