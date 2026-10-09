import { useEffect, useRef, useState } from "react";
import "./extras.css";

function fmt(v) {
  return typeof v === "number" ? `${v.toFixed(1)} ms` : "n/a";
}

function buildSummary(r) {
  const steps = r.steps || [];
  const lines = [];
  lines.push(`=========================================`);
  lines.push(`DNS ITERATIVE TRACE: ${r.domain} (${r.record_type})`);
  lines.push(`=========================================`);
  lines.push(`Application Cache: ${r.cache_hit ? "HIT" : "MISS"}`);
  lines.push(`Total Resolution Time: ${fmt(r.total_time_ms)}`);
  lines.push(`Total Iterative Queries: ${steps.filter((s) => !s.cache_hit).length}`);
  if (typeof r.ttl === "number") lines.push(`Record TTL: ${r.ttl} s`);

  if (steps.length > 0) {
    lines.push("", "--- Resolution Steps ---");
    steps.forEach((s, i) => {
      const n = s.step ?? i + 1;
      if (s.cache_hit) {
        lines.push(`[Step ${n}] APPLICATION CACHE HIT (0 ms)`);
      } else {
        lines.push(
          `[Step ${n}] ${s.server_type} -> ${s.server_name || "Server"} (${s.server}) | ${s.response} | ${fmt(s.response_time_ms)}`
        );
      }
    });
  }

  const answers = r.final_answer || [];
  if (answers.length > 0) {
    lines.push("", "--- Final Answer RRSet ---");
    answers.forEach((a) => lines.push(`  ${a.name}\t${a.ttl}\tIN\t${a.type}\t${a.value}`));
  }
  if (r.error) {
    lines.push("", `--- Diagnostic Error ---`);
    lines.push(`  Code: ${r.error.code} | ${r.error.message}`);
  }
  return lines.join("\n");
}

export default function ResultActions({ result, onClear }) {
  const [copiedType, setCopiedType] = useState(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy(text, type) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopiedType(null), 2500);
    } catch {
      // fallback
    }
  }

  return (
    <div className="result-actions-bar" role="toolbar" aria-label="Trace export and management actions">
      <div className="actions-left">
        <button
          type="button"
          className="action-btn"
          onClick={() => copy(JSON.stringify(result, null, 2), "json")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span>{copiedType === "json" ? "✓ JSON Copied" : "Copy JSON Data"}</span>
        </button>

        <button
          type="button"
          className="action-btn"
          onClick={() => copy(buildSummary(result), "summary")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          <span>{copiedType === "summary" ? "✓ Summary Copied" : "Copy Formatted Trace"}</span>
        </button>
      </div>

      <div className="actions-right">
        <button
          type="button"
          className="action-btn-danger"
          onClick={onClear}
          title="Reset current trace view"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
          <span>Clear Trace</span>
        </button>
      </div>
    </div>
  );
}
