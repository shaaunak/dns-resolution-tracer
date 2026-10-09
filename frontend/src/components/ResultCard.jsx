import { useState } from "react";
import CacheBanner from "./CacheBanner";
import ErrorMessage from "./ErrorMessage";

function MetricCard({ title, value, unit, subtitle, icon, highlightColor }) {
  return (
    <div className={`metric-card ${highlightColor ? `highlight-${highlightColor}` : ""}`}>
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {icon && <span className="metric-icon">{icon}</span>}
      </div>
      <div className="metric-value-row">
        <span className="metric-value">{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
    </div>
  );
}

export default function ResultCard({ result, baselineMs }) {
  const [copiedValue, setCopiedValue] = useState(null);

  const queries = (result.steps || []).filter((s) => !s.cache_hit);
  const sumMs = queries.reduce((tot, s) => tot + (s.response_time_ms ?? 0), 0);
  const avgMs = queries.length > 0 ? sumMs / queries.length : 0;
  const lastStep = queries[queries.length - 1];
  const isAuthoritative = lastStep?.authoritative === true;

  async function handleCopy(text, idx) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedValue(idx);
      setTimeout(() => setCopiedValue(null), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <section className="result-overview-card" aria-labelledby="result-overview-heading">
      {/* Top Banner: Query Target */}
      <div className="result-hero-row">
        <div className="result-target-group">
          <div className="result-target-label">Resolved Target</div>
          <div className="result-target-domain">
            <span className="target-name">{result.domain}</span>
            <span className="target-type-badge">{result.record_type}</span>
            {result.error ? (
              <span className="target-status-badge err">{result.error.code}</span>
            ) : (
              <span className="target-status-badge ok">NOERROR (0)</span>
            )}
          </div>
        </div>

        <div className="result-badge-group">
          <span className="engine-badge">
            <span className="engine-dot" />
            Iterative Engine Complete
          </span>
        </div>
      </div>

      {/* Cache Telemetry Banner */}
      <CacheBanner result={result} baselineMs={baselineMs} />

      {/* Error Message if query failed */}
      {result.error && (
        <ErrorMessage
          code={result.error.code}
          message={result.error.message}
          step={result.error.step}
          recordType={result.record_type}
        />
      )}

      {/* 4-Metric High Density Telemetry Cards */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Latency"
          value={result.total_time_ms ? result.total_time_ms.toFixed(1) : "0.0"}
          unit="ms"
          subtitle={
            result.cache_hit
              ? "Served via in-memory cache"
              : `Avg query: ${avgMs.toFixed(1)} ms`
          }
          highlightColor="coral"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        <MetricCard
          title="Resolution Hops"
          value={result.cache_hit ? "0 (Cache)" : `${queries.length} Queries`}
          unit=""
          subtitle={
            result.cache_hit
              ? "Zero network round-trips"
              : `Traversed Root → TLD → Auth`
          }
          highlightColor="cyan"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="3" x2="6" y2="15" />
              <circle cx="18" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <path d="M18 9a9 9 0 0 1-9 9" />
            </svg>
          }
        />

        <MetricCard
          title="Authoritative Answer"
          value={result.cache_hit ? "Cached" : isAuthoritative ? "AA = True" : "Delegated"}
          unit=""
          subtitle={
            isAuthoritative
              ? "Direct zone authority response"
              : "Standard referral propagation"
          }
          highlightColor="emerald"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
        />

        <MetricCard
          title="Time-To-Live (TTL)"
          value={result.ttl != null ? result.ttl : "—"}
          unit={result.ttl != null ? "s" : ""}
          subtitle={
            result.ttl != null
              ? `Cache valid for ${Math.round(result.ttl / 60)} min`
              : "No TTL returned"
          }
          highlightColor="amber"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          }
        />
      </div>

      {/* Answer RRSet Table */}
      {result.final_answer && result.final_answer.length > 0 && (
        <div className="answer-section">
          <div className="answer-header">
            <div className="answer-title-group">
              <span className="section-dot" />
              <h3 className="answer-title">Answer Section (Final RRset)</h3>
              <span className="answer-count-chip">
                {result.final_answer.length} {result.final_answer.length === 1 ? "Record" : "Records"}
              </span>
            </div>
            <span className="answer-note">Authoritative Resource Records</span>
          </div>

          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th scope="col">Domain Name</th>
                  <th scope="col">Record Type</th>
                  <th scope="col">TTL (Seconds)</th>
                  <th scope="col">Resolved Value / Target</th>
                  <th scope="col" className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {result.final_answer.map((r, i) => (
                  <tr key={`${r.name}-${r.type}-${r.value}-${i}`} className="table-row">
                    <td className="font-mono text-muted">{r.name}</td>
                    <td>
                      <span className="type-pill">{r.type}</span>
                    </td>
                    <td className="font-mono text-amber">{r.ttl}s</td>
                    <td className="font-mono text-bold text-accent">
                      <span className="value-cell">{r.value}</span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="copy-mini-btn"
                        onClick={() => handleCopy(r.value, i)}
                        title="Copy record value to clipboard"
                      >
                        {copiedValue === i ? (
                          <span className="copied-text">✓ Copied</span>
                        ) : (
                          <span>Copy Value</span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
