import TraceStep from "./TraceStep";

export default function TraceTimeline({ steps }) {
  if (!steps?.length) return null;

  const fromCache = steps.length === 1 && steps[0].cache_hit;
  const title = fromCache ? "Cache lookup" : `DNS queries (${steps.length})`;

  return (
    <section className="card" aria-labelledby="timeline-title">
      <h2 id="timeline-title" className="section-title">{title}</h2>
      <ol className="timeline">
        {steps.map((step) => (
          <TraceStep key={step.step} step={step} />
        ))}
      </ol>
    </section>
  );
}
