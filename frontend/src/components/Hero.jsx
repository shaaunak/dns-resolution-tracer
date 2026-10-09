import GlobeScene from "./GlobeScene";

export default function Hero({ onStartDiagnostic, onExploreStory }) {
  return (
    <section className="relative w-full min-h-screen flex flex-col justify-between pt-32 pb-16 px-6 lg:px-16 overflow-hidden bg-[#08090C]">
      {/* 3D Real-Time Three.js Canvas Backdrop */}
      <div className="absolute inset-0 z-0">
        <GlobeScene />
      </div>

      {/* Subtle radial depth gradients */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#FF5722]/5 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#08090C] to-transparent pointer-events-none" />

      {/* Main Editorial Headline & Subcopy */}
      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center gap-8 mt-12 sm:mt-16">
        {/* Classification Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E1117]/80 backdrop-blur-md border border-white/[0.08] text-xs font-mono text-[#8A909E]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5722]" />
          <span>RFC 1034 / 1035 Iterative Network Architecture</span>
        </div>

        {/* Huge Display Headline with Instrument Serif Italic Accent */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-light text-white tracking-[-0.03em] leading-[1.05]">
          The physical journey of a{" "}
          <span className="font-serif italic text-white/95 tracking-normal">
            single packet.
          </span>
        </h1>

        {/* Human Editorial Subcopy */}
        <p className="max-w-2xl text-base sm:text-lg text-[#8A909E] font-light leading-relaxed">
          Before your browser renders a single byte, your query makes a silent, planet-scale
          pilgrimage across transatlantic root clusters, registries, and authoritative zones.
        </p>

        {/* Action Button Group */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
          <button
            type="button"
            onClick={onStartDiagnostic}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#FF5722] hover:bg-[#ff6838] active:scale-[0.98] text-white font-medium text-sm flex items-center justify-center gap-3 transition-all shadow-[0_0_40px_rgba(255,87,34,0.35)]"
          >
            <span>Start Diagnostic</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onExploreStory}
            className="w-full sm:w-auto px-7 py-4 rounded-full bg-white/[0.04] hover:bg-white/[0.08] active:scale-[0.98] text-white/90 text-sm font-mono border border-white/[0.08] transition-all"
          >
            <span>Anatomy of a Lookup ↓</span>
          </button>
        </div>
      </div>

      {/* Bottom Architectural Stat Bar */}
      <div className="relative z-10 max-w-6xl w-full mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 pt-12 border-t border-white/[0.06] text-left">
        <div>
          <div className="text-[11px] font-mono text-[#8A909E] uppercase tracking-wider mb-1">
            Hierarchy
          </div>
          <div className="text-sm font-medium text-white">
            Root → TLD → Auth
          </div>
        </div>

        <div>
          <div className="text-[11px] font-mono text-[#8A909E] uppercase tracking-wider mb-1">
            Anycast Roots
          </div>
          <div className="text-sm font-medium text-white">
            13 Global Clusters
          </div>
        </div>

        <div>
          <div className="text-[11px] font-mono text-[#8A909E] uppercase tracking-wider mb-1">
            Cache Engine
          </div>
          <div className="text-sm font-medium text-white">
            In-Memory LRU RAM
          </div>
        </div>

        <div>
          <div className="text-[11px] font-mono text-[#8A909E] uppercase tracking-wider mb-1">
            Protocol Wire
          </div>
          <div className="text-sm font-medium text-white">
            UDP Port 53 / DNS
          </div>
        </div>
      </div>
    </section>
  );
}
