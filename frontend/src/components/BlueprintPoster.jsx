import React from "react";

// Fallback Blueprint SVG for loading state, reduced-motion, or WebGL failure
export default function BlueprintPoster({ activeTrace }) {
  const rootName =
    activeTrace?.steps?.find((s) => s.server_type === "ROOT")?.server_name || "e.root-servers.net";
  const tldName =
    activeTrace?.steps?.find((s) => s.server_type === "TLD")?.server_name || "a.gtld-servers.net";
  const authName =
    activeTrace?.steps?.find((s) => s.server_type === "AUTHORITATIVE")?.server_name || "ns2.google.com";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "transparent",
      }}
    >
      <svg
        viewBox="0 0 400 280"
        style={{ width: "100%", maxHeight: "260px" }}
        role="img"
        aria-label="DNS Tiered Hierarchy Blueprint"
      >
        {/* Tier lines */}
        <line x1="40" y1="50" x2="360" y2="50" stroke="#e3dcc6" strokeDasharray="3 3" />
        <text x="45" y="42" fill="#7b6267" fontSize="10" fontFamily="sans-serif">
          TIER 1: 13 IANA ROOT CLUSTERS
        </text>

        <line x1="40" y1="140" x2="360" y2="140" stroke="#e3dcc6" strokeDasharray="3 3" />
        <text x="45" y="132" fill="#7b6267" fontSize="10" fontFamily="sans-serif">
          TIER 2: .COM REGISTRY TLD RING
        </text>

        <line x1="40" y1="230" x2="360" y2="230" stroke="#e3dcc6" strokeDasharray="3 3" />
        <text x="45" y="222" fill="#7b6267" fontSize="10" fontFamily="sans-serif">
          TIER 3: AUTHORITATIVE NAMESERVERS
        </text>

        {/* Trajectory curve */}
        <path
          d="M 220 50 Q 280 95, 180 140 T 260 230"
          fill="none"
          stroke="#80aee8"
          strokeWidth="2.5"
        />

        {/* Nodes */}
        <circle cx="220" cy="50" r="6" fill="#5b0015" />
        <circle cx="220" cy="50" r="9" fill="none" stroke="#80aee8" strokeWidth="1.5" />
        <text x="232" y="53" fill="#5b0015" fontSize="10" fontWeight="bold" fontFamily="monospace">
          {rootName}
        </text>

        <circle cx="180" cy="140" r="6" fill="#5b0015" />
        <circle cx="180" cy="140" r="9" fill="none" stroke="#80aee8" strokeWidth="1.5" />
        <text x="192" y="143" fill="#5b0015" fontSize="10" fontWeight="bold" fontFamily="monospace">
          {tldName}
        </text>

        <circle cx="260" cy="230" r="6" fill="#5b0015" />
        <circle cx="260" cy="230" r="9" fill="none" stroke="#80aee8" strokeWidth="1.5" />
        <text x="272" y="233" fill="#5b0015" fontSize="10" fontWeight="bold" fontFamily="monospace">
          {authName}
        </text>
      </svg>
    </div>
  );
}

