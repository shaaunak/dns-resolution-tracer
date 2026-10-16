import React from "react";

export default function HopGraph({ steps, selectedStepIndex, onSelectStep, cacheHit, finalAnswer }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div
      style={{
        overflowX: "auto",
        padding: "16px 4px 20px 4px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        scrollbarWidth: "thin",
      }}
    >
      {steps.map((step, idx) => {
        const isSelected = selectedStepIndex === idx;
        const isTimeout = step.response === "TIMEOUT" || step.response === "NETWORK_ERROR";
        const isAnswer = step.response === "ANSWER";
        const isSubResolution = step.sub_resolution;
        const isCache = step.cache_hit;

        return (
          <React.Fragment key={idx}>
            {/* Hop Card */}
            <div
              onClick={() => onSelectStep(idx)}
              style={{
                flex: "0 0 200px",
                minWidth: "200px",
                maxWidth: "230px",
                backgroundColor: isSelected
                  ? "var(--bg-surface-elevated)"
                  : isCache
                  ? "var(--bg-surface)"
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
                boxShadow: isSelected ? "var(--shadow-md)" : "var(--shadow-sm)",
                position: "relative",
              }}
            >
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
                      width: "6px",
                      height: "6px",
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
                    {isCache
                      ? "APP CACHE"
                      : `HOP ${step.step} - ${step.server_type}`}
                  </span>
                </div>

                {isSubResolution && (
                  <span
                    className="badge badge-muted"
                    style={{ fontSize: "9px", padding: "1px 4px" }}
                    title="Sub-resolution to resolve nameserver address without glue"
                  >
                    SUB-RES
                  </span>
                )}
              </div>

              {/* Server Name / Identity */}
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

              {/* Status & Latency Badges */}
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
              flex: "0 0 180px",
              minWidth: "180px",
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
  );
}

