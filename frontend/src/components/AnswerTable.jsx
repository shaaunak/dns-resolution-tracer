import React, { useState } from "react";

export default function AnswerTable({ records = [], domain, recordType }) {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");

  const copyValue = (val, idx) => {
    navigator.clipboard.writeText(val);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1800);
  };

  const copyAll = () => {
    const text = records.map((r) => `${r.name}\t${r.ttl}\tIN\t${r.type}\t${r.value}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 1800);
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
          backgroundColor: "#ffffff",
        }}
      >
        No answer records returned for {domain} ({recordType}). Check step referral ledger below.
      </div>
    );
  }

  const filteredRecords = records.filter(
    (r) =>
      r.value.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      r.type.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="hairline-card" style={{ marginBottom: "24px", overflow: "hidden", backgroundColor: "#ffffff" }}>
      {/* Header Strip */}
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid var(--border-hairline)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
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
          <span className="badge badge-periwinkle" style={{ fontSize: "10px" }}>
            SECTION: ANSWER ({records.length})
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {records.length > 2 && (
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter records..."
              style={{
                padding: "3px 8px",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                border: "1px solid var(--border-hairline)",
                borderRadius: "var(--radius-xs)",
                outline: "none",
                width: "130px",
              }}
            />
          )}

          <button
            type="button"
            onClick={copyAll}
            className="btn-outline"
            style={{ padding: "3px 10px", fontSize: "11px" }}
          >
            {copiedAll ? "Copied All ✓" : "Copy All Records"}
          </button>
        </div>
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
            {filteredRecords.map((rec, idx) => (
              <tr key={idx}>
                <td style={{ color: "var(--color-primary)", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                  {rec.name}
                </td>
                <td style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>IN</td>
                <td>
                  <span className="badge badge-maroon" style={{ padding: "1px 6px", fontSize: "11px" }}>
                    {rec.type}
                  </span>
                </td>
                <td style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                  {rec.ttl}s
                </td>
                <td style={{ fontWeight: 600, color: "var(--color-text-main)", fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                  {rec.value}
                </td>
                <td style={{ textAlign: "right" }}>
                  <button
                    type="button"
                    onClick={() => copyValue(rec.value, idx)}
                    className="btn-outline"
                    style={{ padding: "2px 8px", fontSize: "10px" }}
                    title="Copy record value to clipboard"
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
