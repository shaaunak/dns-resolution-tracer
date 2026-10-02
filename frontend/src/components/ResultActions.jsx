import { useEffect, useRef, useState } from "react";
import "./extras.css";

function fmt(v) {
  return typeof v === "number" ? `${v.toFixed(1)} ms` : "n/a";
}

function buildSummary(r) {
  const steps = r.steps || [];
  const lines = [];
  lines.push(`DNS trace: ${r.domain} (${r.record_type})`);
  lines.push(`Application cache: ${r.cache_hit ? "HIT" : "MISS"}`);
  lines.push(`Total time: ${fmt(r.total_time_ms)}`);
  lines.push(`DNS queries sent: ${steps.filter((s) => !s.cache_hit).length}`);
  if (typeof r.ttl === "number") lines.push(`TTL: ${r.ttl} s`);

  if (steps.length > 0) {
    lines.push("", "Steps:");
    steps.forEach((s, i) => {
      const n = s.step ?? i + 1;
      if (s.cache_hit) {
        lines.push(`  ${n}. application cache (no network query)`);
      } else {
        lines.push(
          `  ${n}. ${s.server_type} ${s.server_name || ""} (${s.server}) - ${s.response} - ${fmt(s.response_time_ms)}`
        );
      }
    });
  }

  const answers = r.final_answer || [];
  if (answers.length > 0) {
    lines.push("", "Final answer:");
    answers.forEach((a) => lines.push(`  ${a.name} ${a.type} ${a.ttl} ${a.value}`));
  }
  if (r.error) {
    lines.push("", `Error: ${r.error.code} - ${r.error.message}`);
  }
  return lines.join("\n");
}

export default function ResultActions({ result, onClear, onExpandAll, onCollapseAll }) {
  const [note, setNote] = useState("");
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setNote(`${label} copied to clipboard.`);
    } catch {
      setNote("Copy failed. Your browser blocked clipboard access.");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setNote(""), 2500);
  }

  return (
    <div className="actions" role="group" aria-label="Result actions">
      <button
        type="button"
        className="ghost-btn"
        onClick={() => copy(JSON.stringify(result, null, 2), "JSON")}
      >
        COPY JSON
      </button>
      <button
        type="button"
        className="ghost-btn"
        onClick={() => copy(buildSummary(result), "Summary")}
      >
        COPY SUMMARY
      </button>
          <button type="button" className="ghost-btn" onClick={onExpandAll}>
        EXPAND ALL
      </button>
      <button type="button" className="ghost-btn" onClick={onCollapseAll}>
        COLLAPSE ALL
      </button>
      <button type="button" className="ghost-btn" onClick={onClear}>
        CLEAR TRACE
      </button>
      <span className="actions-msg" role="status" aria-live="polite">
        {note}
      </span>
    </div>
  );
}
