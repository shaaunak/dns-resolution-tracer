import React, { useState } from "react";

export default function LatencyWaterfall({ steps = [], totalTimeMs = 1 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!steps || steps.length === 0) return null;

  // Filter out steps with no response_time_ms
  const validSteps = steps.filter((s) => typeof s.response_time_ms === "number");
  if (validSteps.length === 0) return null;

  const maxMs = Math.max(...validSteps.map((s) => s.response_time_ms), 1);
  const sumMs = validSteps.reduce((acc, s) => acc + s.response_time_ms, 0);

  return (
    <div className="hairline-card" style={{ padding: "18px 20px", marginBottom: "24px", backgroundColor: "#ffffff" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--color-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            PER-HOP LATENCY WATERFALL
          </span>
          <span className="badge badge-muted" style={{ fontSize: "10px" }}>
            {validSteps.length} Network Hops
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-text-muted)" }}>
          Cumulative Network Time: <strong>{sumMs.toFixed(1)} ms</strong> • Total Trace: {totalTimeMs.toFixed(1)} ms
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {validSteps.map((step, idx) => {
          const widthPct = Math.max((step.response_time_ms / maxMs) * 100, 4);
          const sharePct = sumMs > 0 ? ((step.response_time_ms / sumMs) * 100).toFixed(0) : 0;
          const isTimeout = step.response === "TIMEOUT" || step.response === "NETWORK_ERROR";
          const isAnswer = step.response === "ANSWER";
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                padding: "6px 8px",
                borderRadius: "var(--radius-xs)",
                backgroundColor: isHovered ? "var(--bg-surface)" : "transparent",
                transition: "background-color 0.15s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "5px",
                  color: "var(--color-text-main)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                    Hop {step.step}: {step.server_type}
                  </span>
                  <span style={{ color: "var(--color-text-muted)" }}>
                    ({step.server_name || step.server})
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "10px" }}>
                    {sharePct}% of wire time
                  </span>
                  <strong style={{ color: isTimeout ? "var(--color-error)" : "var(--color-text-main)" }}>
                    {step.response_time_ms.toFixed(1)} ms
                  </strong>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div
                style={{
                  height: "8px",
                  width: "100%",
                  backgroundColor: "var(--bg-surface-recessed)",
                  borderRadius: "var(--radius-pill)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${widthPct}%`,
                    backgroundColor: isTimeout
                      ? "var(--color-error)"
                      : isAnswer
                      ? "var(--color-primary)"
                      : "var(--color-secondary)",
                    borderRadius: "var(--radius-pill)",
                    transition: "width 0.4s ease, filter 0.15s ease",
                    filter: isHovered ? "brightness(1.15)" : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
