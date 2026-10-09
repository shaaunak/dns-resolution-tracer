export default function Footer() {
  return (
    <footer className="w-full py-20 px-6 lg:px-16 border-t border-white/[0.06] bg-[#050608]">
      <div className="max-w-7xl mx-auto flex flex-col gap-16">
        {/* Large Editorial Headline */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#FF5722] mb-3">
              Standard Specifications
            </div>
            <h3 className="text-4xl sm:text-6xl font-light text-white tracking-tight">
              RFC 1034 & <span className="font-serif italic text-white/90">RFC 1035</span>
            </h3>
          </div>
          <p className="max-w-md text-sm text-[#8A909E] leading-relaxed">
            Domain Names — Concepts, Facilities, Implementation and Specification.
            Iterative resolution protocol defined by P. Mockapetris (ISI, 1987).
          </p>
        </div>

        {/* Minimal Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-10 border-t border-white/[0.06] text-xs font-mono text-[#8A909E]">
          <div>
            <div className="text-white font-medium mb-1">Top-Level Infrastructure</div>
            <p>13 Root Server clusters operated by ICANN, NASA, Verisign, RIPE NCC, WIDE, and US DOD.</p>
          </div>

          <div>
            <div className="text-white font-medium mb-1">Diagnostic Engine</div>
            <p>Direct raw socket UDP transport with application-layer TTL preservation and LRU eviction.</p>
          </div>

          <div>
            <div className="text-white font-medium mb-1">Architecture</div>
            <p>Zero recursive caching shortcuts. Real step-by-step authoritative referral walking.</p>
          </div>
        </div>

        {/* Bottom Wordmark Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/[0.04] text-xs font-mono text-[#505562]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5722]" />
            <span className="text-[#8A909E]">DNS·TRACER</span>
            <span>— Hierarchical Diagnostic Visualizer</span>
          </div>
          <div>All queries executed over standard UDP port 53 sockets</div>
        </div>
      </div>
    </footer>
  );
}
