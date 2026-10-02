import "./path.css";

// Draws YOU -> (one node per real step) -> FINAL ANSWER / error end node.
// Everything comes from the backend response. Nothing is invented.

const ERR = new Set([
  "TIMEOUT",
  "SERVFAIL",
  "REFUSED",
  "NETWORK_ERROR",
  "PARSE_ERROR",
  "OTHER_ERROR",
]);
const WARN = new Set(["NXDOMAIN", "NODATA"]);

function toneFor(step) {
  const r = step.response;
  if (ERR.has(r)) return "err";
  if (WARN.has(r)) return "warn";
  if (r === "ANSWER") return "ok";
  if (r === "CNAME") return "violet";
  return "accent";
}

function labelFor(step) {
  if (step.sub_resolution) return "NS LOOKUP";
  if (!step.server_type || step.server_type === "UNKNOWN") return "SERVER";
  return step.server_type;
}

function fmtMs(v) {
  return typeof v === "number" ? `${v.toFixed(1)} ms` : null;
}

function shorten(text, max = 48) {
  const s = String(text ?? "");
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function buildNodes(result) {
  const steps = Array.isArray(result.steps) ? result.steps : [];
  const err = result.error;
  const isCache = steps.length > 0 && steps.every((s) => s.cache_hit);
  const nodes = [];

  nodes.push({
    key: "you",
    tone: "accent",
    title: "YOU",
    sub: result.domain,
    meta: `${result.record_type} query`,
  });

  if (isCache) {
    nodes.push({
      key: "cache",
      tone: "ok",
      title: "APP CACHE",
      sub: "local application cache",
      meta:
        typeof result.ttl === "number"
          ? `TTL ${result.ttl}s left · no network`
          : "no network",
    });
  } else {
    steps.forEach((s, i) => {
      nodes.push({
        key: `step-${i}`,
        tone: toneFor(s),
        step: `STEP ${s.step ?? i + 1}`,
        title: labelFor(s),
        sub: s.server_name || s.server,
        ip: s.server_name && s.server ? s.server : null,
        meta: [s.response, fmtMs(s.response_time_ms)]
          .filter(Boolean)
          .join(" · "),
        dashed: Boolean(s.sub_resolution),
      });
    });
  }

  if (err) {
    const hasSteps = steps.length > 0;
    nodes.push({
      key: "end",
      tone: WARN.has(err.code) ? "warn" : "err",
      title: hasSteps ? "NO ANSWER" : "REJECTED",
      sub: err.code,
      meta: hasSteps
        ? `after ${steps.length} step${steps.length === 1 ? "" : "s"}`
        : "before any query was sent",
    });
  } else {
    const values = (result.final_answer || []).map((r) => r.value);
    const first = values.length ? shorten(values[0]) : "no records";
    nodes.push({
      key: "end",
      tone: "ok",
      title: "FINAL ANSWER",
      sub: values.length > 1 ? `${first} +${values.length - 1} more` : first,
      meta: fmtMs(result.total_time_ms)
        ? `total ${fmtMs(result.total_time_ms)}`
        : null,
    });
  }

  return nodes;
}

export default function PathGraph({ result }) {
  if (!result) return null;
  const nodes = buildNodes(result);

  return (
    <div className="card">
      <div className="section-title">Resolution path</div>
      <ol className="pg-flow" aria-label="DNS resolution path">
        {nodes.map((n, i) => (
          <li className="pg-item" key={n.key}>
            {i > 0 && (
              <span className="pg-arrow" style={{ "--i": i }} aria-hidden="true" />
            )}
            <div
              className={`pg-node pg-${n.tone}${n.dashed ? " pg-dashed" : ""}`}
              style={{ "--i": i }}
            >
              {n.step && <div className="pg-step">{n.step}</div>}
              <div className="pg-title">{n.title}</div>
              {n.sub && <div className="pg-sub">{n.sub}</div>}
              {n.ip && <div className="pg-ip">{n.ip}</div>}
              {n.meta && <div className="pg-meta">{n.meta}</div>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}