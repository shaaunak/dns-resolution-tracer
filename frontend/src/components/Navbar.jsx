export default function Navbar({
  engineHealth,
  hasResults,
  onRefreshHealth,
  onScrollTo,
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between pointer-events-none">
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between pointer-events-auto">
        {/* Brand Logotype */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex items-center gap-2.5 text-white group"
        >
          <span className="w-2 h-2 rounded-full bg-[#FF5722] group-hover:scale-125 transition-transform" />
          <span className="text-sm font-semibold tracking-wider font-mono">
            DNS·TRACER
          </span>
          <span className="hidden sm:inline text-[10px] font-mono text-[#8A909E] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
            RFC 1035
          </span>
        </a>

        {/* Center Floating Glass Nav */}
        <nav className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#0E1117]/70 backdrop-blur-xl border border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-xs font-mono">
          <button
            type="button"
            onClick={() => onScrollTo("story")}
            className="px-3.5 py-1.5 rounded-full text-[#8A909E] hover:text-white hover:bg-white/[0.06] transition-all"
          >
            How It Works
          </button>
          <button
            type="button"
            onClick={() => onScrollTo("simulator")}
            className="px-3.5 py-1.5 rounded-full text-[#8A909E] hover:text-white hover:bg-white/[0.06] transition-all"
          >
            Interactive Simulator
          </button>
          {hasResults && (
            <button
              type="button"
              onClick={() => onScrollTo("results")}
              className="px-3.5 py-1.5 rounded-full text-[#FF5722] font-medium bg-[#FF5722]/10 hover:bg-[#FF5722]/20 transition-all"
            >
              Diagnostic Results
            </button>
          )}
        </nav>

        {/* Right Status Pill */}
        <div className="flex items-center gap-2">
          {/* Cache Stats */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0E1117]/70 backdrop-blur-xl border border-white/[0.08] text-xs font-mono text-[#8A909E]">
            <span>Cache:</span>
            <strong className="text-white">{engineHealth.hits} Hits</strong>
            <span className="opacity-40">/</span>
            <span>{engineHealth.misses} Misses</span>
          </div>

          {/* Engine Status Button */}
          <button
            type="button"
            onClick={onRefreshHealth}
            title="Click to check engine status"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E1117]/70 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.16] transition-colors text-xs font-mono"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                engineHealth.status === "online"
                  ? "bg-[#10B981] animate-pulse"
                  : engineHealth.status === "offline"
                  ? "bg-[#F43F5E]"
                  : "bg-amber-400"
              }`}
            />
            <span className="text-white/90">
              {engineHealth.status === "online" ? "Engine 200 OK" : "Checking..."}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
