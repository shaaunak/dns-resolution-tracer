import CacheBanner from "./CacheBanner";
import ErrorMessage from "./ErrorMessage";

function Stat({ label, value, unit }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
    </div>
  );
}

export default function ResultCard({ result, baselineMs }) {
  const queries = result.steps.filter((s) => !s.cache_hit);
  const sum = queries.reduce((total, s) => total + (s.response_time_ms ?? 0), 0);
  const average = queries.length ? sum / queries.length : null;

  return (
    <section className="card" aria-labelledby="result-title">
      <h2 id="result-title" className="section-title">Result</h2>
      <p className="result-title">
        {result.domain} <span className="chip accent">{result.record_type}</span>
      </p>

      <CacheBanner result={result} baselineMs={baselineMs} />

      {result.error && (
        <ErrorMessage
          code={result.error.code}
          message={result.error.message}
          step={result.error.step}
          recordType={result.record_type}
        />
      )}

      <div className="stats">
        <Stat label="Total time" value={result.total_time_ms?.toFixed(1) ?? "-"} unit="ms" />
        <Stat label="DNS queries sent" value={queries.length} />
        <Stat label="Avg query time" value={average == null ? "-" : average.toFixed(1)} unit="ms" />
        <Stat
          label={result.cache_hit ? "TTL remaining" : "TTL"}
          value={result.ttl ?? "-"}
          unit={result.ttl != null ? "s" : ""}
        />
      </div>

      {result.final_answer?.length > 0 && (
        <>
          <h3 className="section-title" style={{ marginTop: 24 }}>Final answer</h3>
          <div className="answer-wrap">
            <table className="records">
              <thead>
                <tr><th>Name</th><th>Type</th><th>TTL</th><th>Value</th></tr>
              </thead>
              <tbody>
                {result.final_answer.map((r, i) => (
                  <tr key={`${r.name}-${r.type}-${r.value}-${i}`}>
                    <td>{r.name}</td>
                    <td>{r.type}</td>
                    <td>{r.ttl}</td>
                    <td>{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
