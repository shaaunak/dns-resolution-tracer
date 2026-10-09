import { useState } from "react";
import GlobeScene from "./GlobeScene";

const STORY_STAGES = [
  {
    step: "01",
    phase: "The Question",
    title: "Client Stub Resolver",
    actor: "Localhost Sockets (127.0.0.1)",
    narrative:
      "When your application queries a hostname, the operating system's stub resolver first checks its local in-memory RAM table. On a cold miss, it formats an RFC 1035 datagram and dispatches a UDP packet over port 53.",
    specs: [
      { label: "Protocol", val: "UDP Port 53" },
      { label: "Recursion Flag", val: "RD=0 (Iterative)" },
      { label: "Source", val: "Localhost Stub" },
      { label: "Target", val: "IANA Root Cluster" },
    ],
    technicalNote:
      "The client asks: 'Who knows where google.com is?' The root server does not know the final IP address, but it knows where the .com registry lives.",
  },
  {
    step: "02",
    phase: "The Anchor",
    title: "The Anycast Root Zone",
    actor: "13 Global Clusters (a.root ... m.root)",
    narrative:
      "The query hits one of the 13 IANA anycast root clusters distributed across hundreds of physical global locations. Root nameservers anchor the entire global DNS hierarchy.",
    specs: [
      { label: "Authority", val: "Root Zone (.)" },
      { label: "Response", val: "Referral Delegation" },
      { label: "Payload", val: "TLD Nameserver NS + Glue" },
      { label: "Latency", val: "~14ms - 22ms" },
    ],
    technicalNote:
      "Root response: 'I do not have the host record, but here are the authoritative nameservers for the .com registry (a.gtld-servers.net).'",
  },
  {
    step: "03",
    phase: "The Delegation",
    title: "Top-Level Domain Registry",
    actor: "gTLD / ccTLD Registries (.com, .org, .net)",
    narrative:
      "The resolver takes the referral and queries the Top-Level Domain registry. For a .com domain, the query reaches Verisign's registry servers, which manage every domain registered under that extension.",
    specs: [
      { label: "Registry", val: ".com gTLD Registry" },
      { label: "Response", val: "Zone Delegation (NS)" },
      { label: "Authority Flag", val: "AA=0 (Non-Authoritative)" },
      { label: "Latency", val: "~12ms - 18ms" },
    ],
    technicalNote:
      "Registry response: 'google.com is delegated to Google's authoritative nameservers: ns1.google.com, ns2.google.com.'",
  },
  {
    step: "04",
    phase: "The Answer",
    title: "Authoritative Nameserver",
    actor: "Zone Owner (ns1.google.com)",
    narrative:
      "The resolver finally contacts the domain owner's authoritative nameserver. Because this server holds the master zone file, it answers definitively with the authoritative flag set to true (AA=1).",
    specs: [
      { label: "Authority Flag", val: "AA=1 (Authoritative)" },
      { label: "RCODE", val: "NOERROR" },
      { label: "Answer Payload", val: "Resource Record (A / AAAA)" },
      { label: "TTL Provided", val: "300s (Stored to RAM)" },
    ],
    technicalNote:
      "Authoritative answer: 'Here is the IPv4 record: 142.250.190.46, valid for 300 seconds.' The resolver stores this to RAM and returns it to your browser.",
  },
];

export default function ScrollStory() {
  const [activeStage, setActiveStage] = useState(0);
  const current = STORY_STAGES[activeStage];

  return (
    <section id="story" className="relative w-full py-28 px-6 lg:px-16 border-t border-white/[0.06] bg-[#08090C]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-[#FF5722]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-[#00E5FF]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-14 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF5722]" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#FF5722]">
                Architectural Anatomy
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight">
              The Journey of a <span className="font-serif italic text-white/90">Single Packet</span>
            </h2>
          </div>
          <p className="max-w-md text-sm text-[#8A909E] leading-relaxed">
            RFC 1034 / 1035 defines an iterative hierarchy. Four physical checkpoints ensure no single
            entity commands the global internet phonebook.
          </p>
        </div>

        {/* Interactive Pinned Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 pt-12 items-center">
          {/* Left Column: Stage Selector & Narrative */}
          <div className="lg:col-span-6 flex flex-col gap-8">
            {/* Step Selection Tabs */}
            <div className="grid grid-cols-4 gap-2 p-1.5 rounded-xl bg-[#0E1117] border border-white/[0.06]">
              {STORY_STAGES.map((st, idx) => {
                const isActive = activeStage === idx;
                return (
                  <button
                    key={st.step}
                    type="button"
                    onClick={() => setActiveStage(idx)}
                    className={`relative py-2.5 px-3 rounded-lg text-left transition-all ${
                      isActive
                        ? "bg-white/[0.08] text-white"
                        : "text-[#8A909E] hover:text-white hover:bg-white/[0.03]"
                    }`}
                  >
                    <div className="text-[10px] font-mono text-[#FF5722] mb-0.5">
                      {st.step}
                    </div>
                    <div className="text-xs font-medium truncate">
                      {st.phase}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stage Content Card */}
            <div className="flex flex-col gap-6">
              <div>
                <span className="inline-block text-[11px] font-mono text-[#8A909E] uppercase tracking-wider mb-1">
                  {current.actor}
                </span>
                <h3 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                  {current.title}
                </h3>
              </div>

              <p className="text-base text-[#EDEDED]/90 leading-relaxed font-light">
                {current.narrative}
              </p>

              {/* Wire Protocol Specs Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {current.specs.map((sp) => (
                  <div
                    key={sp.label}
                    className="p-3.5 rounded-lg bg-[#0E1117] border border-white/[0.05]"
                  >
                    <div className="text-[10px] font-mono uppercase text-[#8A909E] tracking-wider mb-1">
                      {sp.label}
                    </div>
                    <div className="text-xs font-mono font-medium text-white">
                      {sp.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Human Technical Insight */}
              <div className="p-4 rounded-xl bg-white/[0.02] border-l-2 border-[#FF5722] text-xs text-[#8A909E] leading-relaxed">
                <strong className="text-white font-medium">Protocol Fact: </strong>
                {current.technicalNote}
              </div>
            </div>

            {/* Step Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setActiveStage((p) => Math.max(0, p - 1))}
                disabled={activeStage === 0}
                className="px-4 py-2 rounded-lg text-xs font-mono text-[#8A909E] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                ← Previous Stage
              </button>
              <div className="text-xs font-mono text-[#8A909E]">
                Stage {activeStage + 1} of 4
              </div>
              <button
                type="button"
                onClick={() => setActiveStage((p) => Math.min(3, p + 1))}
                disabled={activeStage === 3}
                className="px-4 py-2 rounded-lg text-xs font-mono text-[#FF5722] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Next Stage →
              </button>
            </div>
          </div>

          {/* Right Column: 3D Visualizer Centered on Stage */}
          <div className="lg:col-span-6 h-[440px] sm:h-[520px] rounded-2xl bg-[#0E1117] border border-white/[0.06] overflow-hidden relative">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="text-[10px] font-mono uppercase text-[#8A909E] tracking-wider">
                Real-Time 3D Topological Beacon
              </span>
            </div>

            <div className="absolute bottom-4 right-4 z-10 text-[11px] font-mono text-[#8A909E] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              Active Focus: <span className="text-white">{current.title}</span>
            </div>

            <GlobeScene activeStageIndex={activeStage} />
          </div>
        </div>
      </div>
    </section>
  );
}
