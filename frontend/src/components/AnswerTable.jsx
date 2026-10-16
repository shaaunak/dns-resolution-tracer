import React, { useState } from "react";

export default function AnswerTable({ records = [], domain, recordType }) {
  const [copiedIdx, setCopiedIdx] = useState(null);

  const copyValue = (val, idx) => {
    navigator.clipboard.writeText(val);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  if (!records || records.length === 0) {
    return (
      <div
        className="hairline-card"
        style={{
          padding: "24px",
          marginBottom: "24px",
          textAlign: "center",
          color: "var(--color-text-muted)",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
        }}
      >
        No answer records returned for {domain} ({recordType}). Check step referral ledger below.
      </div>
    );
  }

  return (
    <div className="hairline-card" style={{ marginBottom: "24px", overflow: "hidden" }}>
      {/* Header Strip */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "var(--color-success)", fontWeight: "bold" }}>✓</span>
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--color-primary)",
            }}
          >
            Validated Authoritative Answer
          </span>
        </div>
        <span className="badge badge-periwinkle">
          SECTION: ANSWER ({records.length})
        </span>
      </div>

      {/* Table */}
      <div className="dns-table-wrapper" style={{ border: "none", borderRadius: 0 }}>
        <table className="dns-table">
          <thead>
            <tr>
              <th>NAME</th>
              <th>CLASS</th>
              <th>TYPE</th>
              <th>TTL</th>
              <th>RDATA (ANSWER VALUE)</th>
              <th style={{ textAlign: "right" }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec, idx) => (
              <tr key={idx}>
                <td style={{ color: "var(--color-primary)", fontWeight: 500 }}>
                  {rec.name}
                </td>
                <td style={{ color: "var(--color-text-muted)" }}>IN</td>
                <td>
                  <span className="badge badge-maroon" style={{ padding: "1px 6px" }}>
                    {rec.type}
                  </span>
                </td>
                <td style={{ color: "var(--color-text-muted)" }}>{rec.ttl}s</td>
                <td style={{ fontWeight: 600, color: "var(--color-text-main)" }}>
                  {rec.value}
                </td>
                <td style={{ textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={() => copyValue(rec.value, idx)}
                    className="btn-outline"
                    style={{ padding: "2px 8px", fontSize: "10px" }}
                  >
                    {copiedIdx === idx ? "Copied ✓" : "Copy"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

