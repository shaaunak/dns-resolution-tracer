import { useState, useEffect, useRef } from "react";

export default function InteractiveDnsSimulator({ lastTraceResult, onTriggerTrace }) {
  const [activeStep, setActiveStep] = useState(0); // 0: Client, 1: Root, 2: TLD, 3: Auth, 4: Resolved
  const [isPlaying, setIsPlaying] = useState(false);
  const [simMode, setSimMode] = useState("cold"); // "cold" | "cache"
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x or 2x
  const timerRef = useRef(null);

  // If a live trace result is passed from App.jsx, sync simulation data with real result
  const domain = lastTraceResult?.domain || "google.com";
  const recordType = lastTraceResult?.record_type || "A";
  const isCacheHit = lastTraceResult ? lastTraceResult.cache_hit : simMode === "cache";
  const totalMs = lastTraceResult?.total_time_ms ? lastTraceResult.total_time_ms.toFixed(1) : (isCacheHit ? "0.2" : "42.8");
  const resolvedIp = lastTraceResult?.final_answer?.[0]?.value || "142.250.190.46";

  // Real steps or standard simulation steps
  const steps = isCacheHit
    ? [
        {
          id: 0,
          station: "Client / Browser",
          subtitle: "Stub Resolver",
          ip: "127.0.0.1:53042",
          action: `Query issued: IN ${recordType} ${domain}`,
          wire: { type: "QUERY", qname: domain, rtype: recordType, flags: "RD=1", rtt: "0.0ms" },
          detail: "Application checks local in-memory DNS cache table.",
        },
        {
          id: 1,
          station: "Local RAM Cache",
          subtitle: "Memory Intercept",
          ip: "RAM Buffer",
          action: `Cache Hit: ${domain} found with TTL valid`,
          wire: { type: "ANSWER", answer: resolvedIp, flags: "AA=0, QR=1", rtt: "0.1ms" },
          detail: "Sockets bypassed. 0 UDP network packets dispatched. Returned instantaneously.",
        },
      ]
    : [
        {
          id: 0,
          station: "00 // Client Stub",
          subtitle: "Localhost",
          ip: "127.0.0.1",
          action: `Initiates iterative resolution for ${domain}`,
          wire: { type: "QUERY", qname: domain, rtype: recordType, flags: "RD=0 (Iterative)", rtt: "0.0ms" },
          detail: "Client socket opens UDP port 53 and addresses the first Root Nameserver cluster.",
        },
        {
          id: 1,
          station: "01 // Root Zone (.)",
          subtitle: "a.root-servers.net",
          ip: "198.41.0.4",
          action: "Returns Referral to Top-Level Domain",
          wire: { type: "REFERRAL", rcode: "NOERROR", authority: "a.gtld-servers.net (com)", rtt: "18.4ms" },
          detail: "The 13 root anycast clusters do not know hostnames; they refer queries to the TLD registry.",
        },
        {
          id: 2,
          station: "02 // TLD Registry",
          subtitle: "a.gtld-servers.net",
          ip: "192.5.6.30",
          action: "Returns Referral to Authoritative Nameservers",
          wire: { type: "REFERRAL", rcode: "NOERROR", authority: "ns1.google.com", rtt: "14.2ms" },
          detail: "The .com registry delegates authoritative control to the domain owner's designated nameservers.",
        },
        {
          id: 3,
          station: "03 // Authoritative",
          subtitle: "ns1.google.com",
          ip: "216.239.32.10",
          action: `Authoritative Answer: ${resolvedIp}`,
          wire: { type: "ANSWER", rcode: "NOERROR", flags: "AA=1 (Authoritative)", rtt: "10.2ms" },
          detail: "Zone authority returns the definitive Resource Record (RRset) with authoritative flag AA=1.",
        },
      ];

  const maxSteps = steps.length - 1;

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      const delay = (1600 / playbackSpeed);
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

  const handleStepForward = () => {
    setIsPlaying(false);
    setActiveStep((prev) => Math.min(prev + 1, maxSteps));
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setActiveStep(0);
  };

  const currentStepData = steps[activeStep] || steps[0];

  return (
    <div className="w-full bg-[#fcfbf8] border border-[#c1c4c2] rounded-[20px] overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between p-5 border-b border-[#c1c4c2] bg-[#fcfbf8]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-[#001011] text-[#fcfbf8] flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div>
            <span className="text-[17px] font-semibold text-[#001011] tracking-tight">
              Interactive DNS Resolution Protocol Simulator
            </span>
            <span className="hidden sm:inline-block text-xs font-mono text-[#717674] ml-2">
              // Live Packet Traversal Pipeline
            </span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#ededea] border border-[#c1c4c2] rounded-full p-1 text-xs font-mono">
            <button
              type="button"
              className={`px-3 py-1 rounded-full transition-all ${
                !isCacheHit
                  ? "bg-[#001011] text-[#fcfbf8] font-semibold"
                  : "text-[#717674] hover:text-[#001011]"
              }`}
              onClick={() => {
                setSimMode("cold");
                setActiveStep(0);
                setIsPlaying(false);
              }}
            >
              Cold Network (3 Hops)
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-full transition-all ${
                isCacheHit
                  ? "bg-[#fd5321] text-[#fcfbf8] font-semibold"
                  : "text-[#717674] hover:text-[#001011]"
              }`}
              onClick={() => {
                setSimMode("cache");
                setActiveStep(0);
                setIsPlaying(false);
              }}
            >
              Warm Cache (0 Hops)
            </button>
          </div>
          <span className="font-mono text-xs text-[#717674] hidden md:inline">
            (01)
          </span>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="p-6 sm:p-8 flex flex-col gap-8">
        {/* Visual Pipeline Rail */}
        <div className="relative">
          {/* Connecting Hairline SVG Rail */}
          <div className="absolute top-[42px] left-8 right-8 h-1 bg-[#ededea] border-t border-[#c1c4c2] z-0">
            {/* Animated Packet Pulse Bar */}
            <div
              className="h-full bg-[#fd5321] transition-all duration-500 ease-out"
              style={{
                width: `${(activeStep / maxSteps) * 100}%`,
              }}
            />
          </div>

          {/* Interactive Stations Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
            {steps.map((st, idx) => {
              const isActive = idx === activeStep;
              const isPassed = idx < activeStep;

              return (
                <button
                  key={st.station}
                  type="button"
                  onClick={() => {
                    setIsPlaying(false);
                    setActiveStep(idx);
                  }}
                  className={`text-left p-4 rounded-[16px] border transition-all ${
                    isActive
                      ? "bg-[#ededea] border-[#001011] shadow-[0_4px_16px_rgba(0,16,17,0.06)]"
                      : isPassed
                      ? "bg-[#fcfbf8] border-[#c1c4c2] opacity-90"
                      : "bg-[#fcfbf8] border-[#c1c4c2] opacity-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                        isActive
                          ? "bg-[#fd5321] text-[#fcfbf8]"
                          : isPassed
                          ? "bg-[#001011] text-[#fcfbf8]"
                          : "bg-[#ededea] text-[#717674]"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="font-mono text-[10.5px] text-[#717674]">
                      {st.ip}
                    </span>
                  </div>

                  <div className="font-semibold text-sm text-[#001011] truncate">
                    {st.station}
                  </div>
                  <div className="text-xs text-[#717674] font-mono truncate mt-0.5">
                    {st.subtitle}
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#c1c4c2] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#001011] font-medium truncate">
                      {st.wire.type}
                    </span>
                    <span className={isActive ? "text-[#fd5321] font-semibold" : "text-[#717674]"}>
                      {st.wire.rtt}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-Time Packet Inspector & RFC Wire Box */}
        <div className="bg-[#ededea] border border-[#c1c4c2] rounded-[16px] p-5 sm:p-6 flex flex-col md:flex-row gap-6 items-stretch">
          {/* Left: Active Hop Wire Message */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#fd5321] animate-pulse" />
                <span className="font-mono text-xs font-semibold uppercase text-[#fd5321] tracking-wider">
                  Live Wire Transmission · Step {activeStep + 1} of {steps.length}
                </span>
              </div>
              <h4 className="text-lg font-semibold text-[#001011] tracking-tight">
                {currentStepData.action}
              </h4>
              <p className="text-sm text-[#0f1e1f] mt-1.5 leading-relaxed">
                {currentStepData.detail}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[#c1c4c2] font-mono text-xs text-[#717674]">
              <span>TARGET: <strong className="text-[#001011]">{domain}</strong></span>
              <span>/</span>
              <span>TYPE: <strong className="text-[#fd5321]">[{recordType}]</strong></span>
              <span>/</span>
              <span>ACCUMULATED RTT: <strong className="text-[#001011]">{totalMs} ms</strong></span>
            </div>
          </div>

          {/* Right: Technical RFC Header Datagram */}
          <div className="w-full md:w-[320px] bg-[#fcfbf8] border border-[#c1c4c2] rounded-[12px] p-4 font-mono text-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-[#c1c4c2] text-[#717674] text-[11px]">
              <span>RFC 1035 WIRE HEADER</span>
              <span className="text-[#001011] font-bold">PORT 53/UDP</span>
            </div>

            <div className="py-2.5 flex flex-col gap-1.5 text-[11.5px]">
              <div className="flex justify-between">
                <span className="text-[#717674]">MESSAGE TYPE:</span>
                <span className="text-[#001011] font-bold">{currentStepData.wire.type}</span>
              </div>
              {currentStepData.wire.qname && (
                <div className="flex justify-between">
                  <span className="text-[#717674]">QUESTION:</span>
                  <span className="text-[#001011]">{currentStepData.wire.qname}</span>
                </div>
              )}
              {currentStepData.wire.authority && (
                <div className="flex justify-between">
                  <span className="text-[#717674]">AUTHORITY NS:</span>
                  <span className="text-[#001011] truncate max-w-[150px]">{currentStepData.wire.authority}</span>
                </div>
              )}
              {currentStepData.wire.answer && (
                <div className="flex justify-between">
                  <span className="text-[#717674]">ANSWER RR:</span>
                  <span className="text-[#fd5321] font-bold">{currentStepData.wire.answer}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#717674]">FLAGS:</span>
                <span className="text-[#001011]">{currentStepData.wire.flags}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#c1c4c2] flex items-center justify-between text-[11px]">
              <span className="text-[#717674]">SOCKET LATENCY:</span>
              <span className="text-[#fd5321] font-bold">{currentStepData.wire.rtt}</span>
            </div>
          </div>
        </div>

        {/* Playback & Step Controls Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t border-[#c1c4c2]">
          <div className="flex items-center gap-2">
            {/* Play / Pause Button */}
            <button
              type="button"
              className="arrow-pill-btn h-10 px-5 text-xs font-mono"
              onClick={handlePlayToggle}
            >
              <span className="arrow-pill-circle w-6 h-6">
                {isPlaying ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </span>
              <span>{isPlaying ? "Pause Simulation" : activeStep >= maxSteps ? "Replay From Start" : "Play Sequence"}</span>
            </button>

            {/* Step Back */}
            <button
              type="button"
              className="ghost-pill-btn h-10 px-3.5 text-xs font-mono"
              onClick={handleStepBack}
              disabled={activeStep === 0}
              title="Previous Step"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            {/* Step Forward */}
            <button
              type="button"
              className="ghost-pill-btn h-10 px-3.5 text-xs font-mono"
              onClick={handleStepForward}
              disabled={activeStep >= maxSteps}
              title="Next Step"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            {/* Reset */}
            <button
              type="button"
              className="ghost-pill-btn h-10 px-3.5 text-xs font-mono"
              onClick={handleReset}
              title="Reset to Client"
            >
              Reset
            </button>
          </div>

          {/* Speed & Live Trace Sync Trigger */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#ededea] border border-[#c1c4c2] rounded-full p-1 text-xs font-mono">
              <button
                type="button"
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  playbackSpeed === 1 ? "bg-[#001011] text-[#fcfbf8] font-semibold" : "text-[#717674]"
                }`}
                onClick={() => setPlaybackSpeed(1)}
              >
                1x
              </button>
              <button
                type="button"
                className={`px-2.5 py-0.5 rounded-full transition-all ${
                  playbackSpeed === 2 ? "bg-[#001011] text-[#fcfbf8] font-semibold" : "text-[#717674]"
                }`}
                onClick={() => setPlaybackSpeed(2)}
              >
                2x
              </button>
            </div>

            {onTriggerTrace && (
              <button
                type="button"
                className="ghost-pill-btn h-10 px-4 text-xs font-mono text-[#fd5321] border-[#fd5321]"
                onClick={() => onTriggerTrace(domain, recordType)}
              >
                Live Socket Ping
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

