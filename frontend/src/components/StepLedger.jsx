import React, { useState } from "react";

function getStepExplanation(step) {
  if (step.cache_hit) {
    return "Instant hit from our application's in-memory TTL cache. No external DNS query packets were dispatched.";
  }
  if (step.response === "TIMEOUT") {
    return `Query timed out after 3.0 seconds with no reply from ${step.server_name || step.server}. Engine failed over to the next candidate server.`;
  }
  if (step.response === "NETWORK_ERROR") {
    return `Network socket error when connecting to ${step.server_name || step.server}: ${step.note || "Connection failed"}.`;
  }
  if (step.sub_resolution) {
    return `Out-of-bailiwick nameserver referral lacked glue records. Engine autonomously resolved ${step.query} before continuing.`;
  }
  if (step.server_type === "ROOT") {
    const authCount = step.authority?.length || 0;
    const glueCount = step.additional?.length || 0;
    return `Bootstrapped against IANA root server ${step.server_name || step.server}. Server returned a referral to the top-level domain (${authCount} NS delegations, ${glueCount} glue records).`;
  }
  if (step.server_type === "TLD") {
    const authCount = step.authority?.length || 0;
    return `Queried TLD registry server ${step.server_name || step.server}. Server returned delegation referral to the domain's authoritative nameservers (${authCount} NS records).`;
  }
  if (step.server_type === "AUTHORITATIVE") {
    if (step.response === "CNAME") {
      return `Queried authoritative server ${step.server_name || step.server}. Server returned a CNAME alias pointing to a canonical name. Following alias.`;
    }
    if (step.response === "NODATA") {
      return `Queried authoritative server ${step.server_name || step.server}. Domain exists, but no records of requested type ${step.record_type} were found.`;
    }
    if (step.response === "NXDOMAIN") {
      return `Queried authoritative server ${step.server_name || step.server}. Authoritative server confirmed that this domain name does not exist (NXDOMAIN).`;
    }
    return `Reached domain authoritative nameserver ${step.server_name || step.server}. Server answered authoritatively (AA=1) with ${step.records?.length || 0} ${step.record_type} record(s).`;
  }
  return step.note || `Dispatched iterative query to ${step.server_name || step.server} for ${step.query} ${step.record_type}.`;
}

export default function StepLedger({ steps = [], selectedStepIndex, onSelectStep }) {
  const [activeTabPerStep, setActiveTabPerStep] = useState({});

  if (!steps || steps.length === 0) return null;

  const setTab = (stepIdx, tabName) => {
    setActiveTabPerStep((prev) => ({ ...prev, [stepIdx]: tabName }));
  };

  return (
    <div className="hairline-card" style={{ marginBottom: "24px", overflow: "hidden" }}>
      {/* Ledger Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border-hairline)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          backgroundColor: "var(--bg-surface)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "var(--color-primary)" }}>📋</span>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--color-primary)",
            }}
          >
            Iterative Query Ledger & Wire Headers
          </span>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span className="badge badge-periwinkle">EDNS0: 1232 OCTETS</span>
          <span className="badge badge-muted">RD=0 (ITERATIVE)</span>
        </div>
      </div>

      {/* Step Cards List */}
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {steps.map((step, idx) => {
          const isSelected = selectedStepIndex === idx;
          const isTimeout = step.response === "TIMEOUT" || step.response === "NETWORK_ERROR";
          const isAnswer = step.response === "ANSWER";
          const currentTab =
            activeTabPerStep[idx] ||
            (step.records?.length > 0
              ? "answer"
              : step.authority?.length > 0
              ? "authority"
              : step.additional?.length > 0
              ? "additional"
              : "headers");

          return (
            <div
              key={idx}
              id={`step-${idx}`}
              onClick={() => onSelectStep(idx)}
              style={{
                border: isSelected
                  ? "2px solid var(--color-primary)"
                  : isTimeout
                  ? "1px solid var(--color-warning-border)"
                  : "1px solid var(--border-hairline)",
                borderRadius: "var(--radius-sm)",
                backgroundColor: isSelected ? "var(--bg-surface-elevated)" : "var(--bg-surface)",
                padding: "16px",
                transition: "all 0.15s ease",
              }}
            >
              {/* Step Card Top Row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: isTimeout
                        ? "var(--color-error)"
                        : isAnswer
                        ? "var(--color-success)"
                        : "var(--color-primary)",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                    }}
                  >
                    STEP {step.step}: {step.server_type} {step.response}
                  </span>
                  {step.sub_resolution && (
                    <span className="badge badge-muted" style={{ fontSize: "10px" }}>
                      SUB-RESOLUTION
                    </span>
                  )}
                  {step.tcp_fallback && (
                    <span className="badge badge-warning" style={{ fontSize: "10px" }}>
                      TCP FALLBACK (TC=1)
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                  }}
                >
                  <span style={{ color: "var(--color-text-muted)" }}>
                    {step.server_name ? `${step.server_name} [${step.server}]` : step.server}
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
                    {step.response_time_ms ? `${step.response_time_ms.toFixed(1)} ms` : "0 ms"}
                  </span>
                  <span className="badge badge-muted">
                    {step.transport || "UDP"}/53
                  </span>
                </div>
              </div>

              {/* Plain-English Explanation */}
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-main)",
                  lineHeight: 1.5,
                  marginBottom: "12px",
                }}
              >
                {getStepExplanation(step)}
              </p>

              {/* Section Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  borderBottom: "1px solid var(--border-hairline)",
                  paddingBottom: "8px",
                  marginBottom: "10px",
                  flexWrap: "wrap",
                }}
              >
                {step.records?.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTab(idx, "answer");
                    }}
                    style={{
                      padding: "3px 8px",
                      fontSize: "11px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      borderRadius: "var(--radius-xs)",
                      backgroundColor:
                        currentTab === "answer" ? "var(--color-primary)" : "transparent",
                      color: currentTab === "answer" ? "#ffffff" : "var(--color-text-muted)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Answer ({step.records.length})
                  </button>
                )}

                {step.authority?.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTab(idx, "authority");
                    }}
                    style={{
                      padding: "3px 8px",
                      fontSize: "11px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      borderRadius: "var(--radius-xs)",
                      backgroundColor:
                        currentTab === "authority" ? "var(--color-primary)" : "transparent",
                      color: currentTab === "authority" ? "#ffffff" : "var(--color-text-muted)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Authority ({step.authority.length} NS)
                  </button>
                )}

                {step.additional?.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTab(idx, "additional");
                    }}
                    style={{
                      padding: "3px 8px",
                      fontSize: "11px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      borderRadius: "var(--radius-xs)",
                      backgroundColor:
                        currentTab === "additional" ? "var(--color-primary)" : "transparent",
                      color: currentTab === "additional" ? "#ffffff" : "var(--color-text-muted)",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Additional / Glue ({step.additional.length})
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTab(idx, "headers");
                  }}
                  style={{
                    padding: "3px 8px",
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    borderRadius: "var(--radius-xs)",
                    backgroundColor:
                      currentTab === "headers" ? "var(--color-primary)" : "transparent",
                    color: currentTab === "headers" ? "#ffffff" : "var(--color-text-muted)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Wire Headers
                </button>
              </div>

              {/* Tab Contents */}
              {currentTab === "answer" && step.records?.length > 0 && (
                <div className="dns-table-wrapper">
                  <table className="dns-table">
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>TYPE</th>
                        <th>TTL</th>
                        <th>RDATA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {step.records.map((r, rIdx) => (
                        <tr key={rIdx}>
                          <td style={{ color: "var(--color-primary)" }}>{r.name}</td>
                          <td>{r.type}</td>
                          <td>{r.ttl}s</td>
                          <td style={{ fontWeight: 600 }}>{r.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {currentTab === "authority" && step.authority?.length > 0 && (
                <div className="dns-table-wrapper">
                  <table className="dns-table">
                    <thead>
                      <tr>
                        <th>ZONE</th>
                        <th>TYPE</th>
                        <th>TTL</th>
                        <th>DELEGATED NAMESERVER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {step.authority.map((r, rIdx) => (
                        <tr key={rIdx}>
                          <td style={{ color: "var(--color-primary)" }}>{r.name}</td>
                          <td>{r.type}</td>
                          <td>{r.ttl}s</td>
                          <td style={{ fontWeight: 600 }}>{r.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {currentTab === "additional" && step.additional?.length > 0 && (
                <div className="dns-table-wrapper">
                  <table className="dns-table">
                    <thead>
                      <tr>
                        <th>NAMESERVER</th>
                        <th>TYPE</th>
                        <th>TTL</th>
                        <th>GLUE IP ADDRESS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {step.additional.map((r, rIdx) => (
                        <tr key={rIdx}>
                          <td style={{ color: "var(--color-primary)" }}>{r.name}</td>
                          <td>{r.type}</td>
                          <td>{r.ttl}s</td>
                          <td style={{ fontWeight: 600, color: "var(--color-secondary-dark)" }}>
                            {r.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {currentTab === "headers" && (
                <div
                  style={{
                    backgroundColor: "var(--bg-surface-recessed)",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-xs)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    lineHeight: 1.6,
                    color: "var(--color-text-main)",
                  }}
                >
                  <div>
                    <strong>STATUS:</strong> {step.rcode || "NOERROR"} •{" "}
                    <strong>AUTHORITATIVE (AA):</strong> {step.authoritative ? "1 (YES)" : "0 (NO)"} •{" "}
                    <strong>TRUNCATED (TC):</strong> {step.tcp_fallback ? "1" : "0"}
                  </div>
                  <div>
                    <strong>QUERY SENT:</strong> {step.query} IN {step.record_type} •{" "}
                    <strong>RECURSION DESIRED (RD):</strong> 0 (Iterative)
                  </div>
                  <div>
                    <strong>TRANSPORT:</strong> {step.transport} over port 53 •{" "}
                    <strong>OPT PSEUDO-RR:</strong> EDNS0 payload size 1232 octets
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
