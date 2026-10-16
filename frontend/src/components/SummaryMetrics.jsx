import React, { useState, useEffect } from "react";

export default function SummaryMetrics({ traceResult }) {
  if (!traceResult) return null;

  const { total_time_ms, cache_hit, steps = [], ttl, final_answer = [] } = traceResult;

  // Real live countdown for TTL
  const initialTtl = ttl || (final_answer[0]?.ttl ?? 300);
  const [secondsRemaining, setSecondsRemaining] = useState(initialTtl);

  useEffect(() => {
    setSecondsRemaining(initialTtl);
    if (!initialTtl) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [initialTtl]);

  // Compute query stats from live steps
  const liveSteps = steps.filter((s) => !s.cache_hit && typeof s.response_time_ms === "number");
  const queryCount = liveSteps.length;
  const latencies = liveSteps.map((s) => s.response_time_ms);
  const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
  const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 0;
  const avgLatency =
    latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      {/* 1. Total Resolution Time */}
      <div className="hairline-card" style={{ padding: "18px 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            TOTAL RESOLUTION TIME
          </span>
          <span style={{ color: "var(--color-primary)", fontSize: "14px" }}>⏱</span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
          <span
            className="tnum"
            style={{
              fontSize: "30px",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
              color: "var(--color-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {total_time_ms.toFixed(1)}
          </span>
          <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
            ms
          </span>
        </div>

        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          {cache_hit ? (
            <span style={{ color: "var(--color-success)", fontWeight: 600 }}>
              ✓ Served from our in-memory cache
            </span>
          ) : (
            <span>Iterative wire traversal</span>
          )}
        </div>
      </div>

      {/* 2. DNS Queries Sent */}
      <div className="hairline-card" style={{ padding: "18px 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            DNS QUERIES SENT
          </span>
          <span style={{ color: "var(--color-primary)", fontSize: "14px" }}>⇄</span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
          <span
            className="tnum"
            style={{
              fontSize: "30px",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
              color: "var(--color-text-main)",
              letterSpacing: "-0.02em",
            }}
          >
            {cache_hit ? 0 : queryCount}
          </span>
          <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
            queries
          </span>
        </div>

        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          {cache_hit ? "0 UDP/TCP packets dispatched" : "Root → TLD → Authoritative"}
        </div>
      </div>

      {/* 3. Average Query Latency */}
      <div className="hairline-card" style={{ padding: "18px 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            AVERAGE QUERY LATENCY
          </span>
          <span style={{ color: "var(--color-secondary-dark)", fontSize: "14px" }}>📊</span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
          <span
            className="tnum"
            style={{
              fontSize: "30px",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
              color: "var(--color-text-main)",
              letterSpacing: "-0.02em",
            }}
          >
            {cache_hit ? "0.0" : avgLatency.toFixed(1)}
          </span>
          <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
            ms
          </span>
        </div>

        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
          {cache_hit
            ? "Memory fetch overhead ~0.4ms"
            : `min ${minLatency.toFixed(1)}ms · max ${maxLatency.toFixed(1)}ms`}
        </div>
      </div>

      {/* 4. Returned TTL with live countdown */}
      <div className="hairline-card" style={{ padding: "18px 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            RETURNED TTL
          </span>
          <span style={{ color: "var(--color-primary)", fontSize: "14px" }}>⏳</span>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
          <span
            className="tnum"
            style={{
              fontSize: "30px",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
              color: secondsRemaining < 30 ? "var(--color-error)" : "var(--color-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {secondsRemaining}
          </span>
          <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
            seconds
          </span>
        </div>

        <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
          {secondsRemaining === 0 ? (
            <span style={{ color: "var(--color-error)" }}>Expired from cache</span>
          ) : (
            <span>Live cache expiration countdown</span>
          )}
        </div>
      </div>
    </div>
  );
}

