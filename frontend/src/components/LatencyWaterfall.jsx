import React from "react";

export default function LatencyWaterfall({ steps = [], totalTimeMs = 1 }) {
  if (!steps || steps.length === 0) return null;

  // Filter out steps with no response_time_ms
  const validSteps = steps.filter((s) => typeof s.response_time_ms === "number");
  if (validSteps.length === 0) return null;

  const maxMs = Math.max(...validSteps.map((s) => s.response_time_ms), 1);

  return (
    <div className="hairline-card" style={{ padding: "18px 20px", marginBottom: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
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
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-text-muted)" }}>
          Total Wire Time: {totalTimeMs.toFixed(1)} ms
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {validSteps.map((step, idx) => {
          const widthPct = Math.max((step.response_time_ms / maxMs) * 100, 3);
          const isTimeout = step.response === "TIMEOUT" || step.response === "NETWORK_ERROR";
          const isAnswer = step.response === "ANSWER";

          return (
            <div key={idx} style={{ fontSize: "11px", fontFamily: "var(--font-mono)" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                  color: "var(--color-text-main)",
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                    Hop {step.step}: {step.server_type}
                  </span>{" "}
                  <span style={{ color: "var(--color-text-muted)" }}>
                    ({step.server_name || step.server})
                  </span>
                </div>
                <div style={{ fontWeight: 600 }}>
                  {step.response_time_ms.toFixed(1)} ms
                </div>
              </div>

              {/* Bar */}
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
                    transition: "width 0.4s ease",
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

