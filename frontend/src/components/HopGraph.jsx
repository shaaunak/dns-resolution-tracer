import React, { useState, useEffect, useRef } from "react";

export default function HopGraph({
  steps = [],
  selectedStepIndex,
  onSelectStep,
  cacheHit,
  finalAnswer = [],
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);

  if (!steps || steps.length === 0) return null;

  const activeIndex = selectedStepIndex !== null && selectedStepIndex !== undefined
    ? selectedStepIndex
    : 0;
  const activeStep = steps[activeIndex] || steps[0];

  // Auto playback through hops
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }

    playTimerRef.current = setInterval(() => {
      onSelectStep((prev) => {
        const next = (prev === null ? 0 : prev + 1);
        if (next >= steps.length) {
          setIsPlaying(false);
          return steps.length - 1;
        }
        return next;
      });
    }, 1400);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, steps.length, onSelectStep]);

  const handleScrollToLedger = (idx) => {
    const el = document.getElementById(`step-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div>
      {/* Top Controls Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          padding: "10px 18px",
          backgroundColor: "var(--bg-surface-recessed)",
          borderBottom: "1px solid var(--border-hairline-subtle)",
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>
            INTERACTIVE TRAVERSAL FLOW
          </span>
          <span style={{ color: "var(--color-text-muted)" }}>
            ({steps.length} Hop{steps.length > 1 ? "s" : ""})
          </span>
        </div>

        {/* Playback Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
              } else {
                onSelectStep(0);
                setIsPlaying(true);
              }
            }}
            className="btn-outline"
            style={{ padding: "3px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            <span>{isPlaying ? "⏸ Pause" : "▶ Play Walkthrough"}</span>
          </button>

          <button
            type="button"
            disabled={activeIndex <= 0}
            onClick={() => onSelectStep(Math.max(activeIndex - 1, 0))}
            className="btn-outline"
            style={{ padding: "3px 8px", fontSize: "11px" }}
            title="Previous Hop"
          >
            ←
          </button>

          <button
            type="button"
            disabled={activeIndex >= steps.length - 1}
            onClick={() => onSelectStep(Math.min(activeIndex + 1, steps.length - 1))}
            className="btn-outline"
            style={{ padding: "3px 8px", fontSize: "11px" }}
            title="Next Hop"
          >
            →
          </button>
        </div>
      </div>

      {/* Horizontal Hop Cards Track */}
      <div
        style={{
          overflowX: "auto",
          padding: "18px 18px 20px 18px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          scrollbarWidth: "thin",
        }}
      >
        {steps.map((step, idx) => {
          const isSelected = activeIndex === idx;
          const isTimeout = step.response === "TIMEOUT" || step.response === "NETWORK_ERROR";
          const isAnswer = step.response === "ANSWER";
          const isSubResolution = step.sub_resolution;
          const isCache = step.cache_hit;

          return (
            <React.Fragment key={idx}>
              {/* Hop Card */}
              <div
                onClick={() => {
                  setIsPlaying(false);
                  onSelectStep(idx);
                }}
                style={{
                  flex: "0 0 205px",
                  minWidth: "205px",
                  maxWidth: "235px",
                  backgroundColor: isSelected
                    ? "var(--bg-surface-elevated)"
                    : "var(--bg-surface)",
                  border: isSelected
                    ? "2px solid var(--color-primary)"
                    : isTimeout
                    ? "1.5px solid var(--color-warning-border)"
                    : isAnswer
                    ? "1.5px solid var(--border-hairline-active)"
                    : "1px solid var(--border-hairline)",
                  borderRadius: "var(--radius-sm)",
                  padding: "14px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected
                    ? "0 4px 14px rgba(91, 0, 21, 0.12)"
                    : "var(--shadow-sm)",
                  transform: isSelected ? "translateY(-2px)" : "none",
                  position: "relative",
                }}
              >
                {/* Active Indicator Top Pill */}
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-8px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "var(--color-primary)",
                      color: "#ffffff",
                      fontSize: "9px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      padding: "1px 6px",
                      borderRadius: "var(--radius-pill)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    INSPECTING
                  </div>
                )}

                {/* Header: Hop # & Tier Role */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        backgroundColor: isCache
                          ? "var(--color-secondary-dark)"
                          : isTimeout
                          ? "var(--color-error)"
                          : isAnswer
                          ? "var(--color-success)"
                          : "var(--color-primary)",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {isCache ? "APP CACHE" : `HOP ${step.step} • ${step.server_type}`}
                    </span>
                  </div>

                  {isSubResolution && (
                    <span className="badge badge-muted" style={{ fontSize: "9px", padding: "1px 4px" }}>
                      SUB-RES
                    </span>
                  )}
                </div>

                {/* Server Name */}
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: isSelected ? "var(--color-primary)" : "var(--color-text-main)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: "2px",
                  }}
                  title={step.server_name || step.server}
                >
                  {isCache ? "In-Memory Store" : step.server_name || step.server}
                </div>

                {/* IP Address */}
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--color-text-muted)",
                    marginBottom: "10px",
                  }}
                >
                  {isCache ? "Local Process Memory" : step.server}
                </div>

                {/* Status & Latency */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    paddingTop: "8px",
                    borderTop: "1px solid var(--border-hairline-subtle)",
                  }}
                >
                  <span
                    style={{
                      color: isTimeout
                        ? "var(--color-error)"
                        : isAnswer
                        ? "var(--color-success)"
                        : "var(--color-text-main)",
                      fontWeight: 600,
                    }}
                  >
                    {isTimeout
                      ? "TIMEOUT"
                      : isAnswer
                      ? "ANSWER"
                      : step.response === "REFERRAL"
                      ? "REFERRAL"
                      : step.response}
                  </span>

                  <span
                    style={{
                      backgroundColor: "var(--color-secondary-tint)",
                      color: "var(--color-secondary-dark)",
                      padding: "2px 6px",
                      borderRadius: "var(--radius-xs)",
                      fontWeight: 600,
                    }}
                  >
                    +{step.response_time_ms ? `${step.response_time_ms.toFixed(1)}ms` : "0ms"}
                  </span>
                </div>
              </div>

              {/* Directional Connector Arrow */}
              {idx < steps.length - 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: "var(--color-secondary-dark)",
                    fontSize: "16px",
                    fontWeight: "bold",
                    flexShrink: 0,
                    padding: "0 2px",
                  }}
                >
                  →
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Final Answer Node */}
        {finalAnswer && finalAnswer.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                color: "var(--color-success)",
                fontSize: "16px",
                fontWeight: "bold",
                flexShrink: 0,
                padding: "0 2px",
              }}
            >
              →
            </div>

            <div
              style={{
                flex: "0 0 185px",
                minWidth: "185px",
                backgroundColor: "var(--color-success-bg)",
                border: "1.5px solid var(--color-success-border)",
                borderRadius: "var(--radius-sm)",
                padding: "14px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "var(--color-success)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>✓</span>
                <span>FINAL ANSWER</span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--color-text-main)",
                  marginBottom: "4px",
                }}
              >
                {finalAnswer.length} Record{finalAnswer.length > 1 ? "s" : ""}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--color-text-muted)",
                }}
              >
                Type: {finalAnswer[0]?.type || "A"} • TTL: {finalAnswer[0]?.ttl || 300}s
              </div>
            </div>
          </>
        )}
      </div>

      {/* Interactive Hop Inspector Drawer (Below Graph) */}
      {activeStep && (
        <div
          style={{
            padding: "14px 18px",
            backgroundColor: "var(--bg-surface-elevated)",
            borderTop: "1px solid var(--border-hairline)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span className="badge badge-maroon">
              HOP {activeStep.step} INSPECTION
            </span>
            <span>
              <strong>Server:</strong> {activeStep.server_name || "Unknown"} ({activeStep.server})
            </span>
            <span style={{ color: "var(--border-hairline)" }}>•</span>
            <span>
              <strong>Response:</strong> {activeStep.response} ({activeStep.rcode || "NOERROR"})
            </span>
            <span style={{ color: "var(--border-hairline)" }}>•</span>
            <span>
              <strong>Round-Trip:</strong> {activeStep.response_time_ms ? `${activeStep.response_time_ms.toFixed(1)}ms` : "0ms"}
            </span>
            <span style={{ color: "var(--border-hairline)" }}>•</span>
            <span>
              <strong>Authority Records:</strong> {activeStep.authority?.length || 0} NS
            </span>
          </div>

          <div>
            <button
              type="button"
              onClick={() => handleScrollToLedger(activeIndex)}
              className="btn-outline"
              style={{ fontSize: "11px", padding: "4px 10px" }}
            >
              View in Wire Ledger ↓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
