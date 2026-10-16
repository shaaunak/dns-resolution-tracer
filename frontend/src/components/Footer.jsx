import React from "react";
import { Link } from "../context/RouterContext";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-hairline)",
        backgroundColor: "var(--bg-canvas)",
        padding: "36px 0 28px 0",
        marginTop: "auto",
        fontSize: "12px",
      }}
    >
      <div className="layout-container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          {/* Brand Info */}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--color-primary)",
                }}
              >
                dnstrace
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--color-text-muted)",
                }}
              >
                Iterative Telemetry Engine
              </span>
            </div>
            <p style={{ color: "var(--color-text-muted)", maxWidth: "380px", lineHeight: 1.5 }}>
              A deterministic DNS visualizer and iterative resolver built for educational transparency and protocol verification.
            </p>
          </div>

          {/* Quick Links */}
          <div style={{ display: "flex", gap: "36px", flexWrap: "wrap" }}>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "11px",
                  color: "var(--color-primary)",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                  letterSpacing: "0.04em",
                }}
              >
                Navigation
              </div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>
                  <Link to="/" style={{ color: "var(--color-text-main)", textDecoration: "none" }}>
                    Overview
                  </Link>
                </li>
                <li>
                  <Link to="/trace" style={{ color: "var(--color-text-main)", textDecoration: "none" }}>
                    Tracer Application
                  </Link>
                </li>
                <li>
                  <Link to="/learn" style={{ color: "var(--color-text-main)", textDecoration: "none" }}>
                    Protocol Walkthrough
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "11px",
                  color: "var(--color-primary)",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                  letterSpacing: "0.04em",
                }}
              >
                Specifications
              </div>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                }}
              >
                <li>
                  <a
                    href="https://www.rfc-editor.org/rfc/rfc1034"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--color-text-muted)", textDecoration: "none" }}
                  >
                    RFC 1034 (Concepts) ↗
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.rfc-editor.org/rfc/rfc1035"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--color-text-muted)", textDecoration: "none" }}
                  >
                    RFC 1035 (Implementation) ↗
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.rfc-editor.org/rfc/rfc6891"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--color-text-muted)", textDecoration: "none" }}
                  >
                    RFC 6891 (EDNS0 1232) ↗
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Hairline & Legal */}
        <div
          style={{
            borderTop: "1px solid var(--border-hairline-subtle)",
            paddingTop: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            color: "var(--color-text-muted)",
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
          }}
        >
          <div>
            Built with Python 3.14, FastAPI, dnspython, React 19, and Three.js.
          </div>
          <div>
            Iterative mode: RD=0 • Zero OS recursive stub delegation
          </div>
        </div>
      </div>
    </footer>
  );
}
