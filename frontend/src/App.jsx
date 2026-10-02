import { useRef, useState } from "react";
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import CacheControls from "./components/CacheControls";
import ResultCard from "./components/ResultCard";
import TraceTimeline from "./components/TraceTimeline";
import PathGraph from "./components/PathGraph";
import TimeChart from "./components/TimeChart";
import ResultActions from "./components/ResultActions";
import HistoryList from "./components/HistoryList";
import LoadingState, { STAGES } from "./components/LoadingState";
import ErrorMessage from "./components/ErrorMessage";
import { traceDomain } from "./services/api";
import "./trace.css";
import "./cache.css";
import "./states.css";

const HISTORY_LIMIT = 8;

export default function App() {
  const [phase, setPhase] = useState("idle"); // idle | loading | done | failed
  const [request, setRequest] = useState(null);
  const [result, setResult] = useState(null);
  const [baselineMs, setBaselineMs] = useState(null);
  const [failure, setFailure] = useState(null); // { code, message }
  const [history, setHistory] = useState([]);
  // Remembers how long the last real network trace took for each domain + type,
  // so a later cache hit can be compared against it.
  const networkTimes = useRef(new Map());
  const timelineRef = useRef(null);

  async function handleTrace({ domain, recordType }) {
    setRequest({ domain, recordType });
    setPhase("loading");
    setResult(null);
    setFailure(null);
    try {
      const data = await traceDomain(domain, recordType);
      const key = `${data.domain}|${data.record_type}`;
      let baseline = null;
      if (data.cache_hit) {
        baseline = networkTimes.current.get(key) ?? null;
      } else if (!data.error && data.steps.length > 0) {
        networkTimes.current.set(key, data.total_time_ms);
      }
      setBaselineMs(baseline);
      setResult(data);
      setPhase("done");

      // Remember this trace (newest first, one entry per domain + type).
      const entry = {
        id: `${Date.now()}-${Math.random()}`,
        domain: data.domain,
        recordType: data.record_type,
        cacheHit: Boolean(data.cache_hit),
        errorCode: data.error ? data.error.code : null,
        ms: data.total_time_ms,
      };
      setHistory((prev) =>
        [
          entry,
          ...prev.filter(
            (h) => !(h.domain === entry.domain && h.recordType === entry.recordType)
          ),
        ].slice(0, HISTORY_LIMIT)
      );
    } catch (err) {
      setFailure({ code: err.code ?? "BAD_RESPONSE", message: err.message });
      setPhase("failed");
    }
  }

  function handleClear() {
    setResult(null);
    setFailure(null);
    setBaselineMs(null);
    setPhase("idle");
  }

  // Opens or closes every <details> dropdown inside the step cards.
  function setAllDetails(open) {
    if (!timelineRef.current) return;
    timelineRef.current.querySelectorAll("details").forEach((d) => {
      d.open = open;
    });
  }

  // Changes on every new trace so the animations play again.
  const traceKey = result
    ? `${result.domain}|${result.record_type}|${result.total_time_ms}`
    : "";

  return (
    <div className="app">
      <Header />

      <main>
        <section className="hero">
          <h1>DNS TRACE</h1>
          <p className="subtitle">Trace how a domain gets resolved.</p>
          <SearchBar onSubmit={handleTrace} disabled={phase === "loading"} />
          <CacheControls />
        </section>

        <HistoryList
          items={history}
          onRun={handleTrace}
          onClear={() => setHistory([])}
          disabled={phase === "loading"}
        />

        {phase === "loading" && (
          <LoadingState domain={request.domain} recordType={request.recordType} />
        )}

        {phase === "done" && result && (
          <>
            <ResultActions
              result={result}
              onClear={handleClear}
              onExpandAll={() => setAllDetails(true)}
              onCollapseAll={() => setAllDetails(false)}
            />
            <PathGraph key={`path-${traceKey}`} result={result} />
            <ResultCard result={result} baselineMs={baselineMs} />
            <TimeChart key={`time-${traceKey}`} steps={result.steps} />
            <div ref={timelineRef}>
              <TraceTimeline steps={result.steps} />
            </div>
          </>
        )}

        {(phase === "idle" || phase === "failed") && (
          <section className="card" aria-labelledby="path-title">
            <h2 id="path-title" className="section-title">Resolution Path</h2>

            {phase === "failed" && failure && (
              <ErrorMessage code={failure.code} message={failure.message} />
            )}

            <ol className="path">
              {STAGES.map((name) => (
                <li key={name} className="path-node">{name}</li>
              ))}
            </ol>
            {phase === "idle" && (
              <p className="empty-note">
                Waiting for a trace. Real servers appear here after you run one.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}