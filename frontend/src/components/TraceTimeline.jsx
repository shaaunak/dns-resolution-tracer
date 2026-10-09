import TraceStep from "./TraceStep";

export default function TraceTimeline({ steps, highlightedStep }) {
  if (!steps?.length) return null;

  const fromCache = steps.length === 1 && steps[0].cache_hit;
  const title = fromCache ? "Local Cache Interception" : "Iterative Protocol Trace (Detailed Packet Inspector)";

  return (
    <section className="timeline-container-card" id="timeline-section" aria-labelledby="timeline-heading">
      <div className="timeline-header-row">
        <div className="timeline-title-group">
          <span className="timeline-header-badge">Deep Inspection</span>
          <h3 id="timeline-heading" className="timeline-title">{title}</h3>
        </div>
        <div className="timeline-count-badge">
          {fromCache ? "Cache Hit (0 network queries)" : `${steps.length} Queries Executed`}
        </div>
      </div>

      <p className="timeline-subtitle">
        Raw socket exchange metadata, nameserver delegation sections, and DNS header flags for every iterative query step.
      </p>

      <ol className="steps-list">
        {steps.map((step) => (
          <TraceStep
            key={step.step}
            step={step}
            isHighlighted={highlightedStep === step.step}
          />
        ))}
      </ol>
    </section>
  );
}
