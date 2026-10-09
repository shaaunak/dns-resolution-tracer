import "./path.css";

const ERR = new Set([
  "TIMEOUT",
  "SERVFAIL",
  "REFUSED",
  "NETWORK_ERROR",
  "PARSE_ERROR",
  "OTHER_ERROR",
]);
const WARN = new Set(["NXDOMAIN", "NODATA"]);

function getTone(step) {
  const r = step.response;
  if (ERR.has(r)) return "err";
  if (WARN.has(r)) return "warn";
  if (r === "ANSWER") return "ok";
  if (r === "CNAME") return "cname";
  if (step.server_type === "ROOT") return "root";
  if (step.server_type === "TLD") return "tld";
  if (step.server_type === "AUTHORITATIVE") return "auth";
  return "accent";
}

function getZoneTitle(step) {
  if (step.sub_resolution) return "NS GLUE RESOLVER";
  if (step.server_type === "ROOT") return "ROOT ZONE (.)";
  if (step.server_type === "TLD") return "TLD ZONE REGISTRY";
  if (step.server_type === "AUTHORITATIVE") return "AUTHORITATIVE ZONE";
  return step.server_type || "DNS NAMESERVER";
}

function fmtMs(v) {
  return typeof v === "number" ? `${v.toFixed(1)} ms` : null;
}

function shorten(text, max = 36) {
  const s = String(text ?? "");
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function buildNodes(result) {
  const steps = Array.isArray(result.steps) ? result.steps : [];
  const err = result.error;
  const isCache = steps.length > 0 && steps.every((s) => s.cache_hit);
  const nodes = [];

  // Client Node
  nodes.push({
    key: "client",
    nodeType: "client",
    tone: "client",
    zone: "CLIENT",
    title: "Iterative Resolver",
    sub: result.domain,
    meta: `${result.record_type} Query Request`,
    ip: "Localhost",
    stepIndex: null,
  });

  if (isCache) {
    nodes.push({
      key: "cache",
      nodeType: "cache",
      tone: "ok",
      zone: "IN-MEMORY CACHE",
      title: "App Cache Storage",
      sub: "Hit in Memory Store",
      meta: typeof result.ttl === "number" ? `TTL: ${result.ttl}s left` : "Instant Hit",
      ip: "0.0 ms Latency",
      stepIndex: 1,
    });
  } else {
    steps.forEach((s, i) => {
      nodes.push({
        key: `step-${s.step ?? i + 1}`,
        nodeType: "server",
        tone: getTone(s),
        zone: getZoneTitle(s),
        stepNum: s.step ?? i + 1,
        title: s.server_name || s.server,
        sub: s.server_name && s.server ? s.server : `Zone Query: ${s.query}`,
        ip: s.server_name && s.server ? `IP: ${s.server}` : null,
        response: s.response,
        latency: fmtMs(s.response_time_ms),
        isSub: Boolean(s.sub_resolution),
        isTcp: Boolean(s.tcp_fallback),
        stepIndex: s.step ?? i + 1,
      });
    });
  }

  // End Node
  if (err) {
    const hasSteps = steps.length > 0;
    nodes.push({
      key: "end-error",
      nodeType: "terminal",
      tone: WARN.has(err.code) ? "warn" : "err",
      zone: "STATUS TERMINAL",
      title: err.code,
      sub: hasSteps ? `Halted at step ${steps.length}` : "Validation Failed",
      meta: err.message,
      stepIndex: null,
    });
  } else {
    const values = (result.final_answer || []).map((r) => r.value);
    const first = values.length ? shorten(values[0]) : "Success (NOERROR)";
    nodes.push({
      key: "end-success",
      nodeType: "terminal",
      tone: "ok",
      zone: "RESOLVED TARGET",
      title: "Final Answer RRset",
      sub: values.length > 1 ? `${first} (+${values.length - 1} records)` : first,
      meta: fmtMs(result.total_time_ms) ? `Total: ${fmtMs(result.total_time_ms)}` : "Complete",
      stepIndex: null,
    });
  }

  return nodes;
}

export default function PathGraph({ result, onFocusStep }) {
  if (!result) return null;
  const nodes = buildNodes(result);

  function handleNodeClick(stepIndex) {
    if (stepIndex && onFocusStep) {
      onFocusStep(stepIndex);
    }
  }

  return (
    <section className="path-graph-card" aria-labelledby="path-graph-heading">
      <div className="path-graph-header">
        <div className="path-graph-title-group">
          <div className="path-graph-badge">Live Topology Map</div>
          <h2 id="path-graph-heading" className="path-graph-title">
            Visual DNS Resolution Flow
          </h2>
        </div>

        <div className="path-graph-legend">
          <span className="legend-item"><span className="legend-dot root" /> Root</span>
          <span className="legend-item"><span className="legend-dot tld" /> TLD</span>
          <span className="legend-item"><span className="legend-dot auth" /> Authoritative</span>
          <span className="legend-item"><span className="legend-dot ok" /> Resolved</span>
        </div>
      </div>

      <div className="path-viewport">
        <ol className="pipeline-flow" aria-label="DNS Resolution pipeline nodes">
          {nodes.map((node, i) => (
            <li className="pipeline-segment" key={node.key}>
              {i > 0 && (
                <div className="pipeline-connector" aria-hidden="true" style={{ "--idx": i }}>
                  <div className="connector-line">
                    <span className="connector-pulse" />
                  </div>
                  <div className="connector-arrow">▶</div>
                </div>
              )}

              <div
                className={`pipeline-node node-${node.tone} ${node.isSub ? "is-sub" : ""} ${node.stepIndex ? "is-clickable" : ""}`}
                style={{ "--idx": i }}
                onClick={() => handleNodeClick(node.stepIndex)}
                role={node.stepIndex ? "button" : undefined}
                tabIndex={node.stepIndex ? 0 : undefined}
                title={node.stepIndex ? `Click to inspect Step ${node.stepIndex} packet details` : undefined}
                onKeyDown={(e) => {
                  if (node.stepIndex && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    handleNodeClick(node.stepIndex);
                  }
                }}
              >
                {/* Node Top Bar */}
                <div className="node-head">
                  <span className="node-zone">{node.zone}</span>
                  {node.stepNum && <span className="node-step-tag">Step {node.stepNum}</span>}
                </div>

                {/* Node Title / Domain */}
                <div className="node-title" title={node.title}>
                  {node.title}
                </div>

                {/* Node Subtitle */}
                {node.sub && (
                  <div className="node-sub" title={node.sub}>
                    {node.sub}
                  </div>
                )}

                {/* Node Meta / Latency */}
                <div className="node-foot">
                  {node.response && (
                    <span className={`node-response-chip ${node.tone}`}>
                      {node.response}
                    </span>
                  )}
                  {node.latency && (
                    <span className="node-latency">
                      ⚡ {node.latency}
                    </span>
                  )}
                  {node.meta && !node.response && (
                    <span className="node-meta-text">{node.meta}</span>
                  )}
                </div>

                {node.stepIndex && (
                  <div className="node-hover-hint">
                    <span>Inspect Step #{node.stepIndex} →</span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="path-graph-footer">
        <span className="path-footer-icon">ℹ</span>
        <span>
          Each block represents an authoritative delegation hop. Click any node above to drill down into raw Answer, Authority, and Glue packet records.
        </span>
      </div>
    </section>
  );
}