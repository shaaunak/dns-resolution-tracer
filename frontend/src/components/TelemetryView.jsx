import { useState } from "react";

export default function TelemetryView({
  result,
  baselineMs,
  onRequery,
  onPurgeAndRetrace,
}) {
  const [copiedType, setCopiedType] = useState(null);

  if (!result) return null;

  const isCacheHit = Boolean(result.cache_hit);
  const totalMs = result.total_time_ms ?? 0;
  const maxHopMs = Math.max(...(result.steps?.map((s) => s.response_time_ms || 0) || [1]), 30);

  const speedupMultiplier = baselineMs && totalMs > 0
    ? Math.max(1, Math.round(baselineMs / Math.max(totalMs, 0.05)))
    : null;

  // Filter out pure failed mirror attempts if overall resolution succeeded,
  // or mark them as graceful retries so healthy traces don't look broken!
  const displaySteps = result.steps || [];

  const handleCopy = (type) => {
    const text =
      type === "json"
        ? JSON.stringify(result, null, 2)
        : `DNS Trace: ${result.domain} [${result.record_type}]\n` +
          `Total Latency: ${totalMs.toFixed(1)}ms | Cache: ${isCacheHit ? "HIT" : "MISS"}\n` +
          `Answer: ${result.final_answer?.map((r) => `${r.type} ${r.value} (TTL ${r.ttl}s)`).join(", ") || "None"}\n` +
          `Steps:\n${displaySteps.map((s) => `  ${s.step}. ${s.server_name || s.server} (${s.server_type}) -> ${s.response} in ${s.response_time_ms?.toFixed(1) || 0}ms`).join("\n")}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    });
  };

  return (
    <section id="results" className="relative w-full py-24 px-6 lg:px-16 border-t border-white/[0.06] bg-[#08090C]">
      <div className="max-w-7xl mx-auto flex flex-col gap-14">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-1.5 h-1.5 rounded-full ${isCacheHit ? "bg-[#10B981]" : "bg-[#FF5722]"}`} />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#8A909E]">
                Diagnostic Telemetry · {result.domain}
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              Resolution <span className="font-serif italic text-white/90">Audit & Latency</span>
            </h2>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            {isCacheHit ? (
              <button
                type="button"
                onClick={onPurgeAndRetrace}
                className="px-4 py-2.5 rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-white transition-colors"
              >
                Purge RAM & Trace Cold
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequery}
                className="px-4 py-2.5 rounded-xl bg-[#FF5722] hover:bg-[#ff6838] text-xs font-mono text-white transition-colors flex items-center gap-2"
              >
                <span>Re-query to Test Hit</span>
                <span className="text-[11px] opacity-80">→</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleCopy("summary")}
              className="px-3.5 py-2.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-xs font-mono text-[#8A909E] hover:text-white transition-colors"
            >
              {copiedType === "summary" ? "Copied" : "Copy Summary"}
            </button>
          </div>
        </div>

        {/* Hero RTT & Cache Transparency Plinth */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Cumulative RTT Stat */}
          <div className="lg:col-span-5 p-8 rounded-2xl bg-[#0E1117] border border-white/[0.08] flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#8A909E] mb-2">
                Total Elapsed Time
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl sm:text-7xl font-light font-mono text-white tracking-tight">
                  {totalMs.toFixed(1)}
                </span>
                <span className="text-2xl font-mono text-[#FF5722]">ms</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase text-[#8A909E]">
                  Cache State
                </div>
                <div className={`text-base font-medium mt-0.5 ${isCacheHit ? "text-[#10B981]" : "text-[#FF5722]"}`}>
                  {isCacheHit ? "Warm RAM Cache Hit" : "Cold Network Traversal"}
                </div>
              </div>

              {speedupMultiplier && isCacheHit && (
                <div className="text-right">
                  <div className="text-[11px] font-mono uppercase text-[#8A909E]">
                    Acceleration
                  </div>
                  <div className="text-base font-mono font-semibold text-[#10B981] mt-0.5">
                    ~{speedupMultiplier}x Faster
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Definitive Authoritative Answer Banner */}
          <div className="lg:col-span-7 p-8 rounded-2xl bg-[#0E1117] border border-white/[0.08] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#8A909E]">
                  Authoritative Resource Records (RRset)
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  {isCacheHit ? "In-Memory Intercept" : "Authoritative (AA=1)"}
                </span>
              </div>

              {/* Resolved Values */}
              <div className="flex flex-col gap-2 mt-4">
                {result.final_answer && result.final_answer.length > 0 ? (
                  result.final_answer.map((rec, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-[#08090C] border border-white/[0.06] flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-white/[0.08] text-[11px] font-mono text-white font-semibold">
                          {rec.type}
                        </span>
                        <span className="text-base font-mono font-medium text-white break-all">
                          {rec.value}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-[#8A909E] shrink-0">
                        TTL: <strong className="text-white">{rec.ttl}s</strong>
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-[#08090C] border border-white/[0.06] text-sm text-[#8A909E] font-mono">
                    {result.error ? result.error.message : "No resource records returned"}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-[#8A909E] flex items-center justify-between font-mono">
              <span>QUERY: {result.domain}</span>
              <span>TYPE: {result.record_type}</span>
              <span>TTL REMAINING: {result.ttl != null ? `${result.ttl}s` : "—"}</span>
            </div>
          </div>
        </div>

        {/* Latency Waterfall Visualization (Continuous Gradient Bars) */}
        {!isCacheHit && displaySteps.length > 0 && (
          <div className="flex flex-col gap-6 p-8 rounded-2xl bg-[#0E1117] border border-white/[0.08]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-lg font-medium text-white">
                  Round-Trip Latency per Nameserver Hop
                </h3>
                <p className="text-xs text-[#8A909E] mt-0.5">
                  Socket turnaround measurement across the hierarchical delegation chain
                </p>
              </div>

              {/* Oscilloscope Scale Legend */}
              <div className="flex items-center gap-6 text-[11px] font-mono text-[#8A909E]">
                <span>0ms</span>
                <span>{(maxHopMs * 0.5).toFixed(0)}ms</span>
                <span>{maxHopMs.toFixed(0)}ms</span>
              </div>
            </div>

            {/* Hop Rows */}
            <div className="flex flex-col gap-3">
              {displaySteps.map((step, idx) => {
                const hopTime = step.response_time_ms || 0;
                const widthPercent = Math.min(100, Math.max(4, (hopTime / maxHopMs) * 100));

                // If step has an error, but overall trace succeeded, it's a mirror retry!
                const isRetry = Boolean(step.response?.includes("ERROR") || step.response === "TIMEOUT") && !result.error;

                return (
                  <div
                    key={step.step || idx}
                    className="p-4 rounded-xl bg-[#08090C] border border-white/[0.05] hover:border-white/[0.12] transition-colors flex flex-col gap-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-white/[0.08] text-white flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-white font-medium">
                          {step.server_name || step.server}
                        </span>
                        <span className="text-[#8A909E]">
                          ({step.server_type || "DNS"})
                        </span>
                        {isRetry && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Mirror Retry (Fallback)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[#8A909E]">
                          [{step.response}]
                        </span>
                        <span className="text-white font-semibold">
                          {hopTime.toFixed(1)} ms
                        </span>
                      </div>
                    </div>

                    {/* Gradient Latency Bar */}
                    <div className="w-full h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          isRetry
                            ? "bg-amber-500/40"
                            : "bg-gradient-to-r from-[#FF5722] to-[#FF9100]"
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
