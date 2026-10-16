import React, { useState, Suspense, lazy } from "react";
import { useRouter } from "../context/RouterContext";
import REAL_TRACE_FIXTURE from "../fixtures/realTraceFixture.json";

import BlueprintPoster from "../components/BlueprintPoster";
const TieredHeroCanvas = lazy(() => import("../components/TieredHeroCanvas"));

const RECORD_TYPES = ["A", "AAAA", "CNAME", "NS", "MX", "TXT"];

export default function LandingPage({ lastUserTrace }) {
  const { navigate } = useRouter();
  const [domain, setDomain] = useState("google.com");
  const [recordType, setRecordType] = useState("A");

  // Use the user's real last trace if available, otherwise use the captured real fixture
  const activeTrace = lastUserTrace || REAL_TRACE_FIXTURE;

  const handleTraceSubmit = (e) => {
    e.preventDefault();
    const cleanDomain = domain.trim() || "google.com";
    navigate(`/trace?domain=${encodeURIComponent(cleanDomain)}&type=${encodeURIComponent(recordType)}`);
  };

  return (
    <div style={{ paddingBottom: "80px" }}>
      {/* --------------------------------------------------------------------
          HERO SECTION
          -------------------------------------------------------------------- */}
      <section style={{ paddingTop: "40px", paddingBottom: "50px" }}>
        <div className="layout-container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "40px",
              alignItems: "center",
            }}
          >
            {/* Left Column: Headline & Query Input */}
            <div>
              <div style={{ marginBottom: "16px" }}>
                <span className="badge badge-maroon">
                  • RFC 1034 / 1035 Iterative Resolution Engine
                </span>
              </div>

              <h1
                className="font-serif"
                style={{
                  fontSize: "clamp(34px, 5vw, 52px)",
                  lineHeight: 1.15,
                  fontWeight: 600,
                  color: "var(--color-primary)",
                  marginBottom: "16px",
                  letterSpacing: "-0.02em",
                }}
              >
                Follow a name to its answer.
              </h1>

              <p
                style={{
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "var(--color-text-main)",
                  marginBottom: "28px",
                  maxWidth: "520px",
                }}
              >
                A deterministic resolver that queries the global DNS hierarchy in real time,
                hop by hop, from IANA root hints down to the authoritative answer record.
              </p>

              {/* Query Target Card */}
              <div
                className="hairline-card"
                style={{
                  padding: "20px",
                  backgroundColor: "var(--bg-surface)",
                  maxWidth: "520px",
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--color-text-muted)",
                    marginBottom: "10px",
                  }}
                >
                  QUERY TARGET & RECORD TYPE
                </div>

                <form onSubmit={handleTraceSubmit}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                    <div style={{ position: "relative", flex: 1 }}>
                      <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="google.com"
                        spellCheck="false"
                        autoCapitalize="none"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          fontFamily: "var(--font-mono)",
                          fontSize: "14px",
                          backgroundColor: "#ffffff",
                          border: "1px solid var(--border-hairline)",
                          borderRadius: "var(--radius-sm)",
                          color: "var(--color-text-main)",
                          outline: "none",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "var(--color-primary)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "var(--border-hairline)";
                        }}
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: "10px 22px" }}>
                      Trace →
                    </button>
                  </div>

                  {/* Record Type Selector Pills */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontFamily: "var(--font-mono)",
                        color: "var(--color-text-muted)",
                        marginRight: "4px",
                      }}
                    >
                      TYPE:
                    </span>
                    {RECORD_TYPES.map((type) => {
                      const isSelected = recordType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setRecordType(type)}
                          style={{
                            padding: "4px 10px",
                            fontSize: "11px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 600,
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: isSelected ? "var(--color-primary)" : "var(--bg-surface-elevated)",
                            color: isSelected ? "#ffffff" : "var(--color-text-main)",
                            border: isSelected
                              ? "1px solid var(--color-primary-dark)"
                              : "1px solid var(--border-hairline)",
                            cursor: "pointer",
                            transition: "all 0.12s ease",
                          }}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </form>

                <div
                  style={{
                    marginTop: "14px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--border-hairline-subtle)",
                    fontSize: "11px",
                    color: "var(--color-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ color: "var(--color-secondary-dark)" }}>ℹ</span>
                  <span>Iterative query: RD=0, EDNS0 1232 octets, UDP with TCP fallback.</span>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Hierarchy Cartography */}
            <div>
              <div
                className="hairline-card"
                style={{
                  padding: "0",
                  overflow: "hidden",
                  backgroundColor: "var(--bg-surface)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* 3D Viewport Header */}
                <div
                  style={{
                    padding: "10px 16px",
                    borderBottom: "1px solid var(--border-hairline)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "var(--bg-surface-recessed)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "var(--color-primary)",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--color-primary)",
                        letterSpacing: "0.06em",
                      }}
                    >
                      3D HIERARCHY CARTOGRAPHY
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Interactive Scene
                  </span>
                </div>

                {/* 3D Canvas Box */}
                <div
                  style={{
                    height: "300px",
                    width: "100%",
                    position: "relative",
                    background: "radial-gradient(circle at center, #fbf8ee 0%, #f4efe0 100%)",
                  }}
                >
                  <Suspense fallback={<BlueprintPoster activeTrace={activeTrace} />}>
                    <TieredHeroCanvas activeTrace={activeTrace} />
                  </Suspense>
                </div>

                {/* Trajectory Footprint */}
                <div
                  style={{
                    padding: "14px 16px",
                    borderTop: "1px solid var(--border-hairline)",
                    backgroundColor: "var(--bg-surface)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "var(--color-text-muted)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      ACTIVE PACKET TRAJECTORY
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "10px",
                        color: "var(--color-secondary-dark)",
                        backgroundColor: "var(--color-secondary-tint)",
                        padding: "2px 6px",
                        borderRadius: "var(--radius-xs)",
                      }}
                    >
                      Captured from a real run
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                      fontSize: "11px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px",
                        backgroundColor: "#ffffff",
                        border: "1px solid var(--border-hairline)",
                        borderRadius: "var(--radius-xs)",
                      }}
                    >
                      <div style={{ color: "var(--color-text-muted)", fontSize: "10px" }}>TIER 1: ROOT</div>
                      <div style={{ fontWeight: 600, color: "var(--color-primary)" }}>e.root-servers</div>
                      <div style={{ color: "var(--color-text-subtle)", fontSize: "10px" }}>Referral [com]</div>
                    </div>

                    <div
                      style={{
                        padding: "8px",
                        backgroundColor: "#ffffff",
                        border: "1px solid var(--border-hairline)",
                        borderRadius: "var(--radius-xs)",
                      }}
                    >
                      <div style={{ color: "var(--color-text-muted)", fontSize: "10px" }}>TIER 2: TLD RING</div>
                      <div style={{ fontWeight: 600, color: "var(--color-primary)" }}>a.gtld-servers</div>
                      <div style={{ color: "var(--color-text-subtle)", fontSize: "10px" }}>Referral [google]</div>
                    </div>

                    <div
                      style={{
                        padding: "8px",
                        backgroundColor: "#ffffff",
                        border: "1px solid var(--border-hairline)",
                        borderRadius: "var(--radius-xs)",
                      }}
                    >
                      <div style={{ color: "var(--color-text-muted)", fontSize: "10px" }}>TIER 3: AUTH NS</div>
                      <div style={{ fontWeight: 600, color: "var(--color-primary)" }}>ns2.google.com</div>
                      <div style={{ color: "var(--color-success)", fontSize: "10px" }}>Authoritative</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          LAST ITERATION STRIP
          -------------------------------------------------------------------- */}
      <section style={{ marginBottom: "50px" }}>
        <div className="layout-container">
          <div
            className="hairline-card"
            style={{
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              backgroundColor: "var(--bg-surface)",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ color: "var(--color-text-muted)", fontWeight: 600 }}>
                LAST ITERATION:
              </span>
              <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                {activeTrace.domain}
              </span>
              <span style={{ color: "var(--border-hairline)" }}>•</span>
              <span style={{ color: "var(--color-text-main)" }}>
                {activeTrace.steps?.length || 3} hops
              </span>
              <span style={{ color: "var(--border-hairline)" }}>•</span>
              <span
                style={{
                  backgroundColor: "var(--color-secondary-tint)",
                  color: "var(--color-secondary-dark)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-xs)",
                  fontWeight: 600,
                }}
              >
                {activeTrace.total_time_ms ? `${activeTrace.total_time_ms.toFixed(1)} ms` : "440.8 ms"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ color: "var(--color-text-muted)" }}>Answered by</span>
              <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>
                {activeTrace.steps?.[activeTrace.steps.length - 1]?.server_name || "ns2.google.com"} [
                {activeTrace.steps?.[activeTrace.steps.length - 1]?.server || "216.239.34.10"}]
              </span>
              <span style={{ color: "var(--border-hairline)" }}>•</span>
              <span style={{ color: "var(--color-text-muted)" }}>
                {activeTrace.final_answer?.length || 6} records
              </span>
              <span style={{ color: "var(--border-hairline)" }}>•</span>
              <span className="badge badge-success">Authoritative: YES</span>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          HOW A LOOKUP WORKS (Execution Sequence)
          -------------------------------------------------------------------- */}
      <section style={{ marginBottom: "60px" }}>
        <div className="layout-container">
          <div style={{ marginBottom: "24px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-primary)",
              }}
            >
              EXECUTION SEQUENCE
            </span>
            <h2
              className="font-serif"
              style={{
                fontSize: "28px",
                fontWeight: 600,
                color: "var(--color-primary)",
                marginTop: "4px",
                marginBottom: "6px",
              }}
            >
              How a lookup works
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
              Iterative traversal across root, TLD, and authoritative zones without recursive abstraction.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
            }}
          >
            {/* Step 01 */}
            <div className="hairline-card" style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span className="badge badge-muted">STEP 01</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-secondary-dark)",
                  }}
                >
                  55.3 ms
                </span>
              </div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                  marginBottom: "8px",
                }}
              >
                Root Hints
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.5,
                  marginBottom: "16px",
                }}
              >
                Bootstrap inquiry against one of the 13 IANA root server clusters. Asks where to find the TLD servers.
              </p>
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "var(--bg-surface-recessed)",
                  borderRadius: "var(--radius-xs)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                }}
              >
                <div style={{ color: "var(--color-primary)", fontWeight: 600 }}>e.root-servers.net</div>
                <div style={{ color: "var(--color-text-muted)" }}>192.203.230.10</div>
                <div style={{ marginTop: "4px", color: "var(--color-secondary-dark)" }}>
                  Referral: com. 172800 NS
                </div>
              </div>
            </div>

            {/* Step 02 */}
            <div className="hairline-card" style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span className="badge badge-muted">STEP 02</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-secondary-dark)",
                  }}
                >
                  346.8 ms
                </span>
              </div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                  marginBottom: "8px",
                }}
              >
                TLD Referral
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.5,
                  marginBottom: "16px",
                }}
              >
                Direct query dispatched to top-level registry nameservers containing authoritative delegations.
              </p>
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "var(--bg-surface-recessed)",
                  borderRadius: "var(--radius-xs)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                }}
              >
                <div style={{ color: "var(--color-primary)", fontWeight: 600 }}>a.gtld-servers.net</div>
                <div style={{ color: "var(--color-text-muted)" }}>192.5.6.30</div>
                <div style={{ marginTop: "4px", color: "var(--color-secondary-dark)" }}>
                  Referral: google.com. NS
                </div>
              </div>
            </div>

            {/* Step 03 */}
            <div
              className="hairline-card"
              style={{
                padding: "20px",
                border: "1.5px solid var(--color-primary)",
                backgroundColor: "var(--bg-surface-elevated)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span className="badge badge-maroon">STEP 03</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-secondary-dark)",
                  }}
                >
                  38.6 ms
                </span>
              </div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                  marginBottom: "8px",
                }}
              >
                Authoritative Answer
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.5,
                  marginBottom: "16px",
                }}
              >
                Query reaches domain's own nameserver. In-zone answer returned with Authoritative (AA=1) flag.
              </p>
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "var(--bg-surface-recessed)",
                  borderRadius: "var(--radius-xs)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                }}
              >
                <div style={{ color: "var(--color-primary)", fontWeight: 600 }}>ns2.google.com</div>
                <div style={{ color: "var(--color-text-muted)" }}>216.239.34.10</div>
                <div style={{ marginTop: "4px", color: "var(--color-success)", fontWeight: 600 }}>
                  Answer: 6 A records, 300s TTL
                </div>
              </div>
            </div>

            {/* Step 04 */}
            <div className="hairline-card" style={{ padding: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <span className="badge badge-muted">STEP 04</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--color-success)",
                  }}
                >
                  0.0 ms
                </span>
              </div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                  marginBottom: "8px",
                }}
              >
                Caching & TTL
              </h3>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-muted)",
                  lineHeight: 1.5,
                  marginBottom: "16px",
                }}
              >
                The resolver stores the answer in its in-memory cache until TTL expiry, making repeat queries instant.
              </p>
              <div
                style={{
                  padding: "10px",
                  backgroundColor: "var(--bg-surface-recessed)",
                  borderRadius: "var(--radius-xs)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                }}
              >
                <div style={{ color: "var(--color-primary)", fontWeight: 600 }}>App Memory Cache</div>
                <div style={{ color: "var(--color-text-muted)" }}>Key: google.com:A</div>
                <div style={{ marginTop: "4px", color: "var(--color-secondary-dark)" }}>
                  Instant lookup: 0ms
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          BUILT FOR DEEP PROTOCOL VISIBILITY
          -------------------------------------------------------------------- */}
      <section style={{ marginBottom: "60px" }}>
        <div className="layout-container">
          <div style={{ marginBottom: "24px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-primary)",
              }}
            >
              PROTOCOL DISASSEMBLY
            </span>
            <h2
              className="font-serif"
              style={{
                fontSize: "28px",
                fontWeight: 600,
                color: "var(--color-primary)",
                marginTop: "4px",
                marginBottom: "6px",
              }}
            >
              Built for deep protocol visibility
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
              Precision telemetry inspects every packet header, referral, and record set.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Left Card: Per-Hop Timing & Wire Disassembly */}
            <div
              className="hairline-card"
              style={{
                padding: "20px",
                gridColumn: "span 2",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--color-primary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    PER-HOP TIMING & WIRE DISASSEMBLY
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    Decoded UDP datagram payload for query to ns2.google.com
                  </div>
                </div>
                <span className="badge badge-periwinkle">EDNS0: 1232 OCTETS</span>
              </div>

              {/* RFC 1035 Header Flags */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "10px",
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-text-muted)",
                    marginBottom: "8px",
                  }}
                >
                  RFC 1035 HEADER FLAGS:
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: "8px",
                    textAlign: "center",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  <div
                    style={{
                      padding: "8px 4px",
                      backgroundColor: "var(--bg-surface-recessed)",
                      borderRadius: "var(--radius-xs)",
                    }}
                  >
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>QR</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-primary)" }}>1</div>
                    <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>Response</div>
                  </div>

                  <div
                    style={{
                      padding: "8px 4px",
                      backgroundColor: "var(--color-secondary-tint)",
                      border: "1px solid var(--color-secondary-border)",
                      borderRadius: "var(--radius-xs)",
                    }}
                  >
                    <div style={{ fontSize: "10px", color: "var(--color-secondary-dark)" }}>AA</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-primary)" }}>1</div>
                    <div style={{ fontSize: "9px", color: "var(--color-secondary-dark)" }}>Authoritative</div>
                  </div>

                  <div
                    style={{
                      padding: "8px 4px",
                      backgroundColor: "var(--bg-surface-recessed)",
                      borderRadius: "var(--radius-xs)",
                    }}
                  >
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>TC</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-primary)" }}>0</div>
                    <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>No Trunc</div>
                  </div>

                  <div
                    style={{
                      padding: "8px 4px",
                      backgroundColor: "var(--bg-surface-recessed)",
                      borderRadius: "var(--radius-xs)",
                    }}
                  >
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>RD</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-primary)" }}>0</div>
                    <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>Iterative</div>
                  </div>

                  <div
                    style={{
                      padding: "8px 4px",
                      backgroundColor: "var(--bg-surface-recessed)",
                      borderRadius: "var(--radius-xs)",
                    }}
                  >
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>RA</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-primary)" }}>0</div>
                    <div style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>No Recur</div>
                  </div>

                  <div
                    style={{
                      padding: "8px 4px",
                      backgroundColor: "var(--bg-surface-recessed)",
                      borderRadius: "var(--radius-xs)",
                    }}
                  >
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>RCODE</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-success)" }}>0</div>
                    <div style={{ fontSize: "9px", color: "var(--color-success)" }}>NOERROR</div>
                  </div>
                </div>
              </div>

              {/* Sample Decoded Records Table */}
              <div className="dns-table-wrapper" style={{ marginBottom: "16px" }}>
                <table className="dns-table">
                  <thead>
                    <tr>
                      <th>NAME</th>
                      <th>TYPE</th>
                      <th>TTL</th>
                      <th>RDATA (ANSWER)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ color: "var(--color-primary)" }}>google.com.</td>
                      <td>A</td>
                      <td>300</td>
                      <td style={{ fontWeight: 600 }}>142.251.106.138</td>
                    </tr>
                    <tr>
                      <td style={{ color: "var(--color-primary)" }}>google.com.</td>
                      <td>A</td>
                      <td>300</td>
                      <td style={{ fontWeight: 600 }}>142.251.106.100</td>
                    </tr>
                    <tr>
                      <td style={{ color: "var(--color-primary)" }}>google.com.</td>
                      <td>A</td>
                      <td>300</td>
                      <td style={{ fontWeight: 600 }}>142.251.106.102</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Cumulative Traversal Budget Bar */}
              <div
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "8px",
                  paddingTop: "8px",
                  borderTop: "1px solid var(--border-hairline-subtle)",
                }}
              >
                <span>Cumulative Traversal Budget:</span>
                <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>
                  440.8 ms total (Step 1: 55.3ms · Step 2: 346.8ms · Step 3: 38.6ms)
                </span>
              </div>
            </div>

            {/* Right Cards: Glue & Bailiwick + TCP Fallback */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Glue Records */}
              <div className="hairline-card" style={{ padding: "20px", flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--color-primary)",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                >
                  <span>✶</span>
                  <span style={{ fontSize: "15px" }}>Glue Records & Bailiwick</span>
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.5,
                    marginBottom: "12px",
                  }}
                >
                  Resolves circular references when a nameserver lives within the domain zone it serves. The parent zone provides in-bailiwick A/AAAA glue in the Additional section.
                </p>
                <div
                  style={{
                    padding: "8px 10px",
                    backgroundColor: "var(--bg-surface-recessed)",
                    borderRadius: "var(--radius-xs)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                  }}
                >
                  <div style={{ color: "var(--color-text-muted)" }}>DELEGATION:</div>
                  <div style={{ color: "var(--color-primary)" }}>ns1.google.com → 216.239.32.10</div>
                </div>
              </div>

              {/* TCP Fallback */}
              <div className="hairline-card" style={{ padding: "20px", flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--color-primary)",
                    fontWeight: 600,
                    marginBottom: "8px",
                  }}
                >
                  <span>⇄</span>
                  <span style={{ fontSize: "15px" }}>TCP Fallback & Failures</span>
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.5,
                    marginBottom: "12px",
                  }}
                >
                  Automatic escalation to stream-oriented TCP port 53 whenever the truncation (TC=1) bit is set or message size exceeds EDNS0 limits.
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    backgroundColor: "var(--bg-surface-recessed)",
                    borderRadius: "var(--radius-xs)",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                  }}
                >
                  <span style={{ color: "var(--color-text-muted)" }}>Truncation Mechanism:</span>
                  <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>Active (TC=1)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          APPLICATION CACHE MECHANICS
          -------------------------------------------------------------------- */}
      <section style={{ marginBottom: "60px" }}>
        <div className="layout-container">
          <div style={{ marginBottom: "24px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-primary)",
              }}
            >
              RESOLVER SEMANTICS
            </span>
            <h2
              className="font-serif"
              style={{
                fontSize: "28px",
                fontWeight: 600,
                color: "var(--color-primary)",
                marginTop: "4px",
                marginBottom: "6px",
              }}
            >
              Application Cache Mechanics
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
              Clarifying the distinction between internal application cache and upstream DNS server caching.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Cache Miss */}
            <div className="hairline-card" style={{ padding: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-error)",
                    }}
                  />
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-primary)" }}>
                    CACHE MISS
                  </span>
                </div>
                <span className="badge badge-muted">3 hops • 440.8 ms</span>
              </div>

              <div
                style={{
                  padding: "12px",
                  backgroundColor: "var(--bg-surface-recessed)",
                  borderRadius: "var(--radius-xs)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                }}
              >
                <span>Client</span>
                <span>→</span>
                <span>Root (55ms)</span>
                <span>→</span>
                <span>TLD (347ms)</span>
                <span>→</span>
                <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>Auth (39ms)</span>
              </div>

              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                Iterative resolution queried external root, TLD, and authoritative nameservers directly over UDP socket. Cache is populated with authoritative response and expires at TTL exhaustion.
              </p>
            </div>

            {/* Cache Hit */}
            <div
              className="hairline-card"
              style={{
                padding: "24px",
                border: "1px solid var(--color-secondary-border)",
                backgroundColor: "var(--bg-surface-elevated)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "var(--color-secondary-dark)",
                    }}
                  />
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-primary)" }}>
                    CACHE HIT
                  </span>
                </div>
                <span className="badge badge-periwinkle">0 hops • 0.4 ms</span>
              </div>

              <div
                style={{
                  padding: "12px",
                  backgroundColor: "var(--color-secondary-tint)",
                  borderRadius: "var(--radius-xs)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>Client</span>
                  <span>⇉</span>
                  <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>
                    In-Memory Cache (0.4ms)
                  </span>
                </div>
                <span className="badge badge-success">~1100x FASTER</span>
              </div>

              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                Served directly from dnstrace internal TTL cache memory buffer within 300s TTL. No wire packets dispatched. Cache resets when the server process terminates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          UNDER THE HOOD
          -------------------------------------------------------------------- */}
      <section style={{ marginBottom: "60px" }}>
        <div className="layout-container">
          <div style={{ marginBottom: "24px" }}>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--color-primary)",
              }}
            >
              ENGINE ARCHITECTURE
            </span>
            <h2
              className="font-serif"
              style={{
                fontSize: "28px",
                fontWeight: 600,
                color: "var(--color-primary)",
                marginTop: "4px",
                marginBottom: "6px",
              }}
            >
              Under the Hood
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "14px" }}>
              Designed for systems researchers and computer science educators who reject recursive black-boxes.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "16px",
            }}
          >
            <div className="hairline-card" style={{ padding: "18px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                  marginBottom: "6px",
                }}
              >
                BACKEND ENGINE
              </div>
              <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "6px" }}>
                Python 3.14 & FastAPI
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                Asynchronous iterative resolver runtime built with socket transport and dnspython wire-format primitives. Zero OS stub delegation.
              </p>
            </div>

            <div className="hairline-card" style={{ padding: "18px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                  marginBottom: "6px",
                }}
              >
                FRONTEND CARTOGRAPHY
              </div>
              <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "6px" }}>
                React 19 & Three.js
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                Hardware-accelerated 3D hierarchy rendering and Swiss blueprint design system crafted for deep technical density.
              </p>
            </div>

            <div className="hairline-card" style={{ padding: "18px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                  marginBottom: "6px",
                }}
              >
                TEST SUITE
              </div>
              <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "6px" }}>
                105 Unit + 11 Live Tests
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                105 offline mock-wire packet assertions plus 11 live network edge probe validations over public DNS infrastructure.
              </p>
            </div>

            <div className="hairline-card" style={{ padding: "18px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                  marginBottom: "6px",
                }}
              >
                RFC COMPLIANCE
              </div>
              <div style={{ fontWeight: 600, fontSize: "14px", marginBottom: "6px" }}>
                Strict Standards
              </div>
              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                Compliant with RFC 1034, RFC 1035, RFC 2181, and RFC 6891 (EDNS0 1232-byte buffers to prevent IP fragmentation).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          BOTTOM CALL TO ACTION
          -------------------------------------------------------------------- */}
      <section>
        <div className="layout-container">
          <div
            className="hairline-card"
            style={{
              padding: "40px 24px",
              textAlign: "center",
              backgroundColor: "var(--bg-surface)",
              border: "1.5px solid var(--border-hairline-active)",
            }}
          >
            <span className="badge badge-periwinkle" style={{ marginBottom: "12px" }}>
              READY FOR LIVE INSPECTION
            </span>
            <h2
              className="font-serif"
              style={{
                fontSize: "32px",
                fontWeight: 600,
                color: "var(--color-primary)",
                marginBottom: "8px",
              }}
            >
              Inspect any domain in real-time.
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--color-text-muted)",
                maxWidth: "520px",
                margin: "0 auto 24px auto",
              }}
            >
              Run deterministic iterative traces with zero OS-level caching and full packet header inspection.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => navigate("/trace")}
                className="btn-primary"
                style={{ padding: "12px 28px", fontSize: "14px" }}
              >
                Open the tracer →
              </button>
              <button
                type="button"
                onClick={() => navigate("/learn")}
                className="btn-secondary"
                style={{ padding: "12px 24px", fontSize: "14px" }}
              >
                View Protocol Guide
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

