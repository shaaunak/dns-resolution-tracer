import React, { useState, useEffect } from "react";
import { Link, useRouter } from "../context/RouterContext";
import { getHealth } from "../services/api";

export default function Navbar({ onClearCache }) {
  const { pathname } = useRouter();
  const [health, setHealth] = useState({
    status: "checking", // online | offline | checking
    uptime_s: 0,
    cache: { entries: 0, hits: 0, misses: 0 },
  });
  const [showHealthDetail, setShowHealthDetail] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await getHealth();
      setHealth({
        status: "online",
        uptime_s: data.uptime_s || 0,
        cache: data.cache || { entries: 0, hits: 0, misses: 0 },
      });
    } catch {
      setHealth((prev) => ({ ...prev, status: "offline" }));
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border-hairline)",
        backgroundColor: "var(--bg-canvas)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="layout-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
          gap: "16px",
        }}
      >
        {/* Left: Brand + Real Health Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link
            to="/"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "baseline",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--color-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              dnstrace
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              v1.0
            </span>
          </Link>

          {/* Real Backend Health Pill */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowHealthDetail(!showHealthDetail)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "3px 10px",
                borderRadius: "var(--radius-pill)",
                backgroundColor: "var(--bg-surface)",
                border: "1px solid var(--border-hairline)",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-main)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Click to view backend telemetry details"
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor:
                    health.status === "online"
                      ? "#1d7344"
                      : health.status === "checking"
                      ? "#9e6400"
                      : "#ba1a1a",
                  display: "inline-block",
                }}
              />
              <span style={{ fontWeight: 500 }}>
                {health.status === "online"
                  ? "Backend connected"
                  : health.status === "checking"
                  ? "Connecting..."
                  : "Backend offline"}
              </span>
              {health.status === "online" && (
                <span style={{ color: "var(--color-text-muted)", fontSize: "10px" }}>
                  (cache: {health.cache.entries})
                </span>
              )}
            </button>

            {/* Health / Cache Telemetry Dropdown */}
            {showHealthDetail && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "8px",
                  width: "280px",
                  backgroundColor: "var(--bg-surface-elevated)",
                  border: "1px solid var(--border-hairline)",
                  borderRadius: "var(--radius-sm)",
                  padding: "14px",
                  boxShadow: "var(--shadow-md)",
                  zIndex: 50,
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                    borderBottom: "1px solid var(--border-hairline-subtle)",
                    paddingBottom: "6px",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>
                    ENGINE TELEMETRY
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color:
                        health.status === "online" ? "var(--color-success)" : "var(--color-error)",
                    }}
                  >
                    {health.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Target API:</span>
                    <span style={{ color: "var(--color-text-main)" }}>127.0.0.1:8000</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Uptime:</span>
                    <span>{Math.round(health.uptime_s)}s</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Cache Entries:</span>
                    <span style={{ fontWeight: 600 }}>{health.cache.entries}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Cache Hits / Misses:</span>
                    <span>
                      {health.cache.hits} / {health.cache.misses}
                    </span>
                  </div>
                </div>

                {health.status === "offline" && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "8px",
                      backgroundColor: "var(--color-error-bg)",
                      border: "1px solid var(--color-error-border)",
                      borderRadius: "var(--radius-xs)",
                      fontSize: "11px",
                      color: "var(--color-error)",
                    }}
                  >
                    <strong>Start local engine:</strong>
                    <div style={{ marginTop: "4px", color: "var(--color-text-main)" }}>
                      <code>uvicorn main:app --port 8000</code>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Navigation Links */}
        <nav className="nav-desktop-links" style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link
            to="/"
            style={{
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 500,
              color: pathname === "/" ? "var(--color-primary)" : "var(--color-text-muted)",
              borderBottom: pathname === "/" ? "2px solid var(--color-primary)" : "2px solid transparent",
              padding: "4px 0",
              transition: "color 0.15s ease",
            }}
          >
            Overview
          </Link>
          <Link
            to="/trace"
            style={{
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 500,
              color: pathname.startsWith("/trace") ? "var(--color-primary)" : "var(--color-text-muted)",
              borderBottom: pathname.startsWith("/trace") ? "2px solid var(--color-primary)" : "2px solid transparent",
              padding: "4px 0",
              transition: "color 0.15s ease",
            }}
          >
            Tracer App
          </Link>
          <Link
            to="/learn"
            style={{
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 500,
              color: pathname.startsWith("/learn") ? "var(--color-primary)" : "var(--color-text-muted)",
              borderBottom: pathname.startsWith("/learn") ? "2px solid var(--color-primary)" : "2px solid transparent",
              padding: "4px 0",
              transition: "color 0.15s ease",
            }}
          >
            Protocol Walkthrough
          </Link>
          <a
            href="https://github.com/shaaunak/dns-resolution-tracer"
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--color-text-muted)",
              padding: "4px 0",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            GitHub
            <span style={{ fontSize: "10px" }}>↗</span>
          </a>
        </nav>

        {/* Right CTA */}
        <div className="nav-cta-btn">
          <Link to="/trace" className="btn-primary" style={{ padding: "6px 14px", fontSize: "12px" }}>
            Run Trace →
          </Link>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div
        className="mobile-nav-bar"
        style={{
          display: "none",
          borderTop: "1px solid var(--border-hairline-subtle)",
          padding: "6px 16px",
          justifyContent: "space-around",
          alignItems: "center",
          backgroundColor: "var(--bg-surface)",
          fontSize: "12px",
          fontFamily: "var(--font-mono)",
        }}
      >
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: pathname === "/" ? "var(--color-primary)" : "var(--color-text-muted)",
            fontWeight: pathname === "/" ? 700 : 500,
          }}
        >
          Overview
        </Link>
        <Link
          to="/trace"
          style={{
            textDecoration: "none",
            color: pathname.startsWith("/trace") ? "var(--color-primary)" : "var(--color-text-muted)",
            fontWeight: pathname.startsWith("/trace") ? 700 : 500,
          }}
        >
          Tracer
        </Link>
        <Link
          to="/learn"
          style={{
            textDecoration: "none",
            color: pathname.startsWith("/learn") ? "var(--color-primary)" : "var(--color-text-muted)",
            fontWeight: pathname.startsWith("/learn") ? 700 : 500,
          }}
        >
          Protocol Guide
        </Link>
      </div>
    </header>
  );
}
