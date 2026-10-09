import { useState, useEffect, useRef } from "react";

const RECORD_TYPES = [
  { value: "A", label: "A (IPv4)" },
  { value: "AAAA", label: "AAAA (IPv6)" },
  { value: "CNAME", label: "CNAME" },
  { value: "NS", label: "NS" },
  { value: "MX", label: "MX" },
  { value: "TXT", label: "TXT" },
];

const PRESETS = [
  { domain: "google.com", type: "A" },
  { domain: "cloudflare.com", type: "AAAA" },
  { domain: "www.bbc.co.uk", type: "A" },
  { domain: "github.com", type: "MX" },
];

export default function InteractiveSimulator({
  domainInput,
  setDomainInput,
  recordType,
  setRecordType,
  onRunTrace,
  isLoading,
  lastTraceResult,
  onPurgeCache,
  onLivePing,
  livePingResult,
  isPinging,
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [simMode, setSimMode] = useState("cold"); // "cold" | "cache"
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const timerRef = useRef(null);

  // Sync simulation values with live trace if available
  const domain = domainInput.trim() || lastTraceResult?.domain || "google.com";
  const isCacheHit = lastTraceResult ? Boolean(lastTraceResult.cache_hit) : simMode === "cache";
  const resolvedIp = lastTraceResult?.final_answer?.[0]?.value || "142.250.190.46";
  const totalMs = lastTraceResult?.total_time_ms ? lastTraceResult.total_time_ms.toFixed(1) : (isCacheHit ? "0.2" : "44.6");

  // Step definitions: Clearly 4 stages for cold traversal (or 2 for warm RAM hit)
  const steps = isCacheHit
    ? [
        {
          id: 0,
          stationNumber: "01",
          role: "Stub Resolver",
          title: "Application Client",
          address: "127.0.0.1:53042",
          action: `Query issued: IN ${recordType} ${domain}`,
          latency: "0.0ms",
          detail: "Operating system stub resolver intercepts query and inspects local RAM cache table.",
          wire: { type: "QUERY", qname: domain, flags: "RD=1", rcode: "—" },
        },
        {
          id: 1,
          stationNumber: "02",
          role: "In-Memory RAM",
          title: "Local Host Cache",
          address: "RAM Intercept",
          action: `Cache Hit: Valid TTL record found for ${domain}`,
          latency: "0.1ms",
          detail: "Sockets bypassed. 0 network UDP packets dispatched. Answer returned instantaneously.",
          wire: { type: "ANSWER", qname: domain, answer: resolvedIp, flags: "AA=0, QR=1", rcode: "NOERROR" },
        },
      ]
    : [
        {
          id: 0,
          stationNumber: "01",
          role: "Stub Resolver",
          title: "Local Machine",
          address: "127.0.0.1",
          action: `Dispatches iterative resolution for ${domain}`,
          latency: "0.0ms",
          detail: "Client opens UDP port 53 and addresses the first available Root Nameserver cluster.",
          wire: { type: "QUERY", qname: domain, flags: "RD=0 (Iterative)", rcode: "—" },
        },
        {
          id: 1,
          stationNumber: "02",
          role: "Root Anycast (.)",
          title: "a.root-servers.net",
          address: "198.41.0.4",
          action: "Returns referral to .com TLD registry",
          latency: "18.4ms",
          detail: "Root cluster does not hold hostname records; delegates query to registry nameservers.",
          wire: { type: "REFERRAL", authority: "a.gtld-servers.net", flags: "AA=0, QR=1", rcode: "NOERROR" },
        },
        {
          id: 2,
          stationNumber: "03",
          role: "TLD Registry",
          title: "a.gtld-servers.net",
          address: "192.5.6.30",
          action: "Returns referral to Authoritative zone",
          latency: "14.2ms",
          detail: "The .com registry delegates authoritative control to the domain's designated nameservers.",
          wire: { type: "REFERRAL", authority: "ns1.google.com", flags: "AA=0, QR=1", rcode: "NOERROR" },
        },
        {
          id: 3,
          stationNumber: "04",
          role: "Authoritative",
          title: "ns1.google.com",
          address: "216.239.32.10",
          action: `Returns Authoritative Answer: ${resolvedIp}`,
          latency: "12.0ms",
          detail: "Zone owner answers definitively with Master Resource Record and Authoritative flag AA=1.",
          wire: { type: "ANSWER", answer: resolvedIp, flags: "AA=1, QR=1", rcode: "NOERROR" },
        },
      ];

  const maxSteps = steps.length - 1;

  // Auto-play animation timer
  useEffect(() => {
    if (isPlaying) {
      const delay = 1800 / playbackSpeed;
      timerRef.current = setTimeout(() => {
        setActiveStep((prev) => {
          if (prev >= maxSteps) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, delay);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, activeStep, maxSteps, playbackSpeed]);

  const handlePlayToggle = () => {
    if (activeStep >= maxSteps) {
      setActiveStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const currentStep = steps[activeStep] || steps[0];

  return (
    <section id="simulator" className="relative w-full py-24 px-6 lg:px-16 border-t border-white/[0.06] bg-[#08090C]">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#00E5FF]">
                Protocol Simulator & Workbench
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              Interactive <span className="font-serif italic text-white/90">Resolution Pipeline</span>
            </h2>
          </div>

          {/* Mode Switcher: Cold vs Warm Cache */}
          <div className="flex items-center gap-3">
            <div className="relative flex p-1 rounded-xl bg-[#0E1117] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setSimMode("cold");
                  setActiveStep(0);
                  setIsPlaying(false);
                }}
                className={`relative z-10 px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
                  !isCacheHit
                    ? "text-white font-medium bg-white/[0.08]"
                    : "text-[#8A909E] hover:text-white"
                }`}
              >
                Full Network Traversal (4 Stages)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimMode("cache");
                  setActiveStep(0);
                  setIsPlaying(false);
                }}
                className={`relative z-10 px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
                  isCacheHit
                    ? "text-[#10B981] font-medium bg-[#10B981]/15"
                    : "text-[#8A909E] hover:text-white"
                }`}
              >
                Warm RAM Cache (0 Network Hops)
              </button>
            </div>
          </div>
        </div>

        {/* Search Console Input Surface */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0E1117] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onRunTrace(domainInput, recordType);
            }}
            className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center"
          >
            {/* Hostname Search Input */}
            <div className="flex-1 relative flex items-center bg-[#08090C] border border-white/[0.08] focus-within:border-[#FF5722]/60 rounded-xl px-4 py-3.5 transition-colors">
              <span className="text-xs font-mono text-[#8A909E] mr-3 select-none">
                tracer://
              </span>
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="domain name e.g. google.com, cloudflare.com, bbc.co.uk..."
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-transparent text-sm sm:text-base text-white placeholder:text-[#505562] focus:outline-none font-mono"
              />
            </div>

            {/* Segmented Record Type Selector */}
            <div className="flex items-center gap-1 p-1 bg-[#08090C] border border-white/[0.08] rounded-xl overflow-x-auto">
              {RECORD_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setRecordType(t.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                    recordType === t.value
                      ? "bg-white/[0.12] text-white font-semibold"
                      : "text-[#8A909E] hover:text-white"
                  }`}
                >
                  {t.value}
                </button>
              ))}
            </div>

            {/* Run Diagnostic Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3.5 rounded-xl bg-[#FF5722] hover:bg-[#ff6838] active:scale-[0.98] text-white font-medium text-sm flex items-center justify-center gap-2.5 transition-all shadow-[0_0_30px_rgba(255,87,34,0.3)] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Traversing Sockets...</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Execute Trace</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Preset Domains */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/[0.05]">
            <span className="text-[11px] font-mono text-[#8A909E] mr-1">Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={`${p.domain}-${p.type}`}
                type="button"
                onClick={() => {
                  setDomainInput(p.domain);
                  setRecordType(p.type);
                  onRunTrace(p.domain, p.type);
                }}
                disabled={isLoading}
                className="px-3 py-1 rounded-md text-xs font-mono bg-white/[0.03] hover:bg-white/[0.08] text-[#8A909E] hover:text-white border border-white/[0.05] transition-colors"
              >
                {p.domain} <span className="text-[#FF5722]">[{p.type}]</span>
              </button>
            ))}

            <button
              type="button"
              onClick={onPurgeCache}
              className="ml-auto text-xs font-mono text-[#8A909E] hover:text-[#FF5722] transition-colors"
              title="Clears in-memory RAM cache table"
            >
              Purge RAM Cache
            </button>
          </div>
        </div>

        {/* Main Resolution Pipeline Rail (Spacious, Zero-Collide) */}
        <div className="flex flex-col gap-6">
          {/* Animated Connecting SVG Rail */}
          <div className="relative pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
              {steps.map((st, idx) => {
                const isActive = idx === activeStep;
                const isPassed = idx < activeStep;

                return (
                  <button
                    key={st.stationNumber}
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setActiveStep(idx);
                    }}
                    className={`relative p-5 rounded-2xl text-left border transition-all ${
                      isActive
                        ? "bg-[#141820] border-[#FF5722] shadow-[0_0_30px_rgba(255,87,34,0.12)]"
                        : isPassed
                        ? "bg-[#0E1117] border-white/[0.12] opacity-85"
                        : "bg-[#0E1117]/60 border-white/[0.05] opacity-50 hover:opacity-75"
                    }`}
                  >
                    {/* Top Row: Station ID & IP Address */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                            isActive
                              ? "bg-[#FF5722] text-white"
                              : isPassed
                              ? "bg-white/[0.15] text-white"
                              : "bg-white/[0.05] text-[#8A909E]"
                          }`}
                        >
                          {st.stationNumber}
                        </span>
                        <span className="text-[11px] font-mono text-[#8A909E] uppercase tracking-wider">
                          {st.role}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-medium text-white/90">
                        {st.latency}
                      </span>
                    </div>

                    {/* Server Identity */}
                    <div className="text-base font-medium text-white truncate">
                      {st.title}
                    </div>

                    {/* IP Monospace Chip */}
                    <div className="mt-1 text-xs font-mono text-[#00E5FF] truncate">
                      {st.address}
                    </div>

                    {/* Wire Action Snapshot */}
                    <div className="mt-4 pt-3 border-t border-white/[0.06] text-xs text-[#8A909E] line-clamp-2">
                      {st.action}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Inspector & RFC 1035 Datagram Readout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8 rounded-2xl bg-[#0E1117] border border-white/[0.08]">
            {/* Left: Human Technical Description */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#FF5722] animate-pulse" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF5722] font-semibold">
                    Stage {activeStep + 1} of {steps.length} · {currentStep.role}
                  </span>
                </div>
                <h3 className="text-2xl font-light text-white tracking-tight">
                  {currentStep.action}
                </h3>
                <p className="text-sm text-[#8A909E] mt-2 leading-relaxed">
                  {currentStep.detail}
                </p>
              </div>

              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono text-[#8A909E]">
                <span>TARGET: <strong className="text-white">{domain}</strong></span>
                <span>/</span>
                <span>TYPE: <strong className="text-[#FF5722]">[{recordType}]</strong></span>
                <span>/</span>
                <span>ACCUMULATED RTT: <strong className="text-white">{totalMs} ms</strong></span>
              </div>
            </div>

            {/* Right: Technical RFC Header Datagram */}
            <div className="lg:col-span-5 p-5 rounded-xl bg-[#08090C] border border-white/[0.06] font-mono text-xs flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] text-[11px] text-[#8A909E]">
                <span>RFC 1035 WIRE HEADER</span>
                <span className="text-white font-medium">PORT 53 / UDP</span>
              </div>

              <div className="flex flex-col gap-2 text-[11.5px]">
                <div className="flex justify-between">
                  <span className="text-[#8A909E]">MESSAGE TYPE:</span>
                  <span className="text-white font-semibold">{currentStep.wire.type}</span>
                </div>
                {currentStep.wire.qname && (
                  <div className="flex justify-between">
                    <span className="text-[#8A909E]">QUESTION:</span>
                    <span className="text-white">{currentStep.wire.qname}</span>
                  </div>
                )}
                {currentStep.wire.authority && (
                  <div className="flex justify-between">
                    <span className="text-[#8A909E]">AUTHORITY NS:</span>
                    <span className="text-white truncate max-w-[180px]">{currentStep.wire.authority}</span>
                  </div>
                )}
                {currentStep.wire.answer && (
                  <div className="flex justify-between">
                    <span className="text-[#8A909E]">ANSWER RR:</span>
                    <span className="text-[#10B981] font-semibold">{currentStep.wire.answer}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#8A909E]">FLAGS:</span>
                  <span className="text-white">{currentStep.wire.flags}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px]">
                <span className="text-[#8A909E]">SOCKET RTT:</span>
                <span className="text-[#FF5722] font-semibold">{currentStep.latency}</span>
              </div>
            </div>
          </div>

          {/* Transport Controls Bar & Live Socket Ping Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#0E1117] border border-white/[0.06]">
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlayToggle}
                className="px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-mono flex items-center gap-2 transition-colors"
              >
                {isPlaying ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>{activeStep >= maxSteps ? "Replay From Start" : "Play Sequence"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep((p) => Math.max(0, p - 1));
                }}
                disabled={activeStep === 0}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8A909E] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous Hop"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep((p) => Math.min(maxSteps, p + 1));
                }}
                disabled={activeStep >= maxSteps}
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#8A909E] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Next Hop"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep(0);
                }}
                className="px-3 py-2 rounded-lg text-xs font-mono text-[#8A909E] hover:text-white transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Speed Toggle & Live Socket Ping Action */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-[#08090C] border border-white/[0.08] rounded-lg p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setPlaybackSpeed(1)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    playbackSpeed === 1 ? "bg-white/[0.12] text-white" : "text-[#8A909E]"
                  }`}
                >
                  1x
                </button>
                <button
                  type="button"
                  onClick={() => setPlaybackSpeed(2)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    playbackSpeed === 2 ? "bg-white/[0.12] text-white" : "text-[#8A909E]"
                  }`}
                >
                  2x
                </button>
              </div>

              {/* Live Socket Ping Action */}
              <button
                type="button"
                onClick={() => onLivePing && onLivePing(domain, recordType)}
                disabled={isPinging}
                className="px-4 py-2 rounded-lg border border-[#00E5FF]/40 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] text-xs font-mono flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
                <span>{isPinging ? "Pinging Sockets..." : "Live Socket Ping"}</span>
                {livePingResult && (
                  <span className="text-white font-semibold ml-1">
                    [{livePingResult}ms]
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
