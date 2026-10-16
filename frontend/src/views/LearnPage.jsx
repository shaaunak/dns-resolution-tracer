import React, { useState } from "react";
import REAL_TRACE_FIXTURE from "../fixtures/realTraceFixture.json";

export default function LearnPage({ lastUserTrace }) {
  const activeTrace = lastUserTrace || REAL_TRACE_FIXTURE;
  const steps = activeTrace.steps || [];
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  const currentStep = steps[currentStepIdx] || steps[0];

  return (
    <div style={{ paddingBottom: "80px", paddingTop: "24px" }}>
      <div className="layout-container">
        {/* Page Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ marginBottom: "12px" }}>
            <span className="badge badge-maroon">Educational Technical Primer</span>
          </div>

          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 600,
              color: "var(--color-primary)",
              marginBottom: "8px",
              letterSpacing: "-0.015em",
            }}
          >
            DNS Architecture & Resolution Walkthrough
          </h1>

          <p style={{ color: "var(--color-text-muted)", fontSize: "15px", maxWidth: "720px", lineHeight: 1.6 }}>
            Understand the exact mechanics of the global Domain Name System: how 13 root hints bootstrap queries, how zone delegations and glue records work, why UDP falls back to TCP, and how iterative resolvers walk the tree.
          </p>
        </div>

        {/* ------------------------------------------------------------------
            INTERACTIVE REPLAYER (USES USER'S REAL TRACE OR REAL FIXTURE)
            ------------------------------------------------------------------ */}
        {currentStep && (
          <div
            className="hairline-card"
            style={{
              padding: "24px",
              marginBottom: "48px",
              backgroundColor: "var(--bg-surface)",
              border: "1.5px solid var(--border-hairline-active)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div>
                <span className="badge badge-periwinkle" style={{ marginBottom: "4px" }}>
                  INTERACTIVE TRACE REPLAYER
                </span>
                <h3
                  className="font-serif"
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "var(--color-primary)",
                  }}
                >
                  Replaying {activeTrace.domain} ({activeTrace.record_type})
                </h3>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-text-muted)" }}>
                  Hop {currentStepIdx + 1} of {steps.length}
                </span>
                <button
                  type="button"
                  disabled={currentStepIdx === 0}
                  onClick={() => setCurrentStepIdx((i) => Math.max(i - 1, 0))}
                  className="btn-secondary"
                  style={{ padding: "4px 10px", fontSize: "11px" }}
                >
                  ← Prev Hop
                </button>
                <button
                  type="button"
                  disabled={currentStepIdx === steps.length - 1}
                  onClick={() => setCurrentStepIdx((i) => Math.min(i + 1, steps.length - 1))}
                  className="btn-primary"
                  style={{ padding: "4px 12px", fontSize: "11px" }}
                >
                  Next Hop →
                </button>
              </div>
            </div>

            {/* Replay Hop Card */}
            <div
              style={{
                padding: "16px",
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-hairline)",
                borderRadius: "var(--radius-sm)",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="badge badge-maroon">
                    HOP {currentStep.step}: {currentStep.server_type}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--color-text-main)" }}>
                    {currentStep.server_name || currentStep.server}
                  </span>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                    [{currentStep.server}]
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span className="badge badge-periwinkle">
                    +{currentStep.response_time_ms ? `${currentStep.response_time_ms.toFixed(1)}ms` : "0ms"}
                  </span>
                  <span className="badge badge-muted">
                    {currentStep.transport}/53
                  </span>
                </div>
              </div>

              <div
                style={{
                  fontSize: "13px",
                  color: "var(--color-text-main)",
                  lineHeight: 1.6,
                  padding: "12px",
                  backgroundColor: "var(--bg-surface-recessed)",
                  borderRadius: "var(--radius-xs)",
                  marginBottom: "14px",
                }}
              >
                {currentStep.server_type === "ROOT" && (
                  <p>
                    <strong>Root Query:</strong> The resolver queried IANA root server{" "}
                    <code>{currentStep.server_name}</code> asking for <code>{currentStep.query}</code>. Because root
                    servers do not store domain records directly, it returned a <strong>referral</strong> to the{" "}
                    <code>.com</code> Top-Level Domain (TLD) registry with {currentStep.authority?.length || 13} authoritative
                    delegation NS records and {currentStep.additional?.length || 13} glue IP addresses.
                  </p>
                )}

                {currentStep.server_type === "TLD" && (
                  <p>
                    <strong>TLD Query:</strong> Following the referral, the resolver queried TLD server{" "}
                    <code>{currentStep.server_name}</code> for <code>{currentStep.query}</code>. The TLD server responded with a
                    referral delegating the domain to Google's authoritative nameservers (
                    {currentStep.authority?.map((a) => a.value).join(", ")}).
                  </p>
                )}

                {currentStep.server_type === "AUTHORITATIVE" && (
                  <p>
                    <strong>Authoritative Query:</strong> The resolver queried authoritative server{" "}
                    <code>{currentStep.server_name}</code>. Because this server is authoritative for the zone, it set the{" "}
                    <strong>AA=1 (Authoritative Answer)</strong> flag and returned the final answer records.
                  </p>
                )}

                {currentStep.cache_hit && (
                  <p>
                    <strong>App Cache Hit:</strong> The resolver matched <code>{currentStep.query}</code> in our application's
                    in-memory TTL cache and returned the valid records instantly without generating external UDP queries.
                  </p>
                )}
              </div>

              {/* Wire details for this hop */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "8px",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <div style={{ padding: "8px", backgroundColor: "#ffffff", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-xs)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>RESPONSE RCODE:</span>{" "}
                  <strong>{currentStep.rcode || "NOERROR"}</strong>
                </div>
                <div style={{ padding: "8px", backgroundColor: "#ffffff", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-xs)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>AUTHORITATIVE (AA):</span>{" "}
                  <strong>{currentStep.authoritative ? "1 (YES)" : "0 (NO)"}</strong>
                </div>
                <div style={{ padding: "8px", backgroundColor: "#ffffff", border: "1px solid var(--border-hairline)", borderRadius: "var(--radius-xs)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>TRUNCATED (TC):</span>{" "}
                  <strong>{currentStep.tcp_fallback ? "1 (FALLBACK TO TCP)" : "0 (UDP OK)"}</strong>
                </div>
              </div>
            </div>

            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
              Data source: Captured from a real live resolution run.
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            CORE ARCHITECTURAL CONCEPTS
            ------------------------------------------------------------------ */}
        <section style={{ marginBottom: "48px" }}>
          <h2
            className="font-serif"
            style={{
              fontSize: "26px",
              fontWeight: 600,
              color: "var(--color-primary)",
              marginBottom: "20px",
            }}
          >
            Key Protocol Mechanics
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {/* 1. Root Hints */}
            <div className="hairline-card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-primary)", marginBottom: "8px" }}>
                1. Root Hints & Bootstrap
              </h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: "12px" }}>
                There are 13 logical root nameservers (named <code>a.root-servers.net</code> through <code>m.root-servers.net</code>), operated by 12 independent institutions (e.g. ICANN, NASA, Verisign, RIPE, WIDE). Every iterative resolver maintains a static "root hints" file containing their hardcoded IP addresses to bootstrap resolution.
              </p>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--color-primary)", backgroundColor: "var(--bg-surface-recessed)", padding: "8px", borderRadius: "var(--radius-xs)" }}>
                Anycast routing mirrors these 13 root identities across 1,700+ physical sites worldwide.
              </div>
            </div>

            {/* 2. Zone Delegation & Referrals */}
            <div className="hairline-card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-primary)", marginBottom: "8px" }}>
                2. Zone Delegation & Referrals
              </h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: "12px" }}>
                DNS is organized as an inverted tree. The root zone (<code>.</code>) delegates the <code>.com</code> zone to registry servers via NS records. In an iterative lookup, the server does not fetch the answer for you; it sends back a <strong>referral</strong> (an empty Answer section, but with NS records in the Authority section).
              </p>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--color-secondary-dark)", backgroundColor: "var(--color-secondary-tint)", padding: "8px", borderRadius: "var(--radius-xs)" }}>
                Referral = Answer: 0 records, Authority: N nameserver records.
              </div>
            </div>

            {/* 3. In-Bailiwick Glue Records */}
            <div className="hairline-card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-primary)", marginBottom: "8px" }}>
                3. Glue Records & Bailiwick
              </h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: "12px" }}>
                If <code>google.com</code> delegates its nameservers to <code>ns1.google.com</code>, an iterative resolver cannot resolve <code>google.com</code> without knowing <code>ns1.google.com</code>'s IP, creating an impossible circular dependency. To break this, the parent zone provides <strong>glue records</strong> (A/AAAA) in the <strong>ADDITIONAL</strong> section.
              </p>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--color-text-main)", backgroundColor: "var(--bg-surface-recessed)", padding: "8px", borderRadius: "var(--radius-xs)" }}>
                Without glue: Engine autonomously spawns a sub-resolution for the nameserver's name.
              </div>
            </div>

            {/* 4. CNAME Aliasing */}
            <div className="hairline-card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-primary)", marginBottom: "8px" }}>
                4. CNAME Aliasing & Recursion Limits
              </h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: "12px" }}>
                A <code>CNAME</code> (Canonical Name) record maps an alias to a target domain (e.g. <code>www.github.com → github.com</code>). When an iterative resolver receives a CNAME, it must restart the entire traversal from the root hints for the new target name.
              </p>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--color-primary)", backgroundColor: "var(--bg-surface-recessed)", padding: "8px", borderRadius: "var(--radius-xs)" }}>
                Guardrails: Hard limit of 8 CNAME hops and loop detection prevent infinite cycles.
              </div>
            </div>

            {/* 5. Transport & TCP Fallback */}
            <div className="hairline-card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-primary)", marginBottom: "8px" }}>
                5. Transport & TCP Fallback
              </h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: "12px" }}>
                DNS uses UDP port 53 for low latency. Under EDNS0 (RFC 6891), our resolver advertises a <strong>1232-byte</strong> buffer size (the DNS Flag Day 2020 standard to avoid IP fragmentation). If a response exceeds this size, the server sets the <code>TC=1</code> (Truncated) bit, instructing the resolver to repeat the query over stream TCP.
              </p>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--color-secondary-dark)", backgroundColor: "var(--color-secondary-tint)", padding: "8px", borderRadius: "var(--radius-xs)" }}>
                UDP first (payload 1232) → TCP fallback only if TC=1.
              </div>
            </div>

            {/* 6. Application Caching */}
            <div className="hairline-card" style={{ padding: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--color-primary)", marginBottom: "8px" }}>
                6. TTL & Application Caching
              </h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.5, marginBottom: "12px" }}>
                Each DNS record carries a TTL (Time-to-Live) in seconds assigned by the authoritative administrator. Our application maintains an in-memory cache keyed by <code>(domain, record_type)</code>. Repeat traces within the TTL window resolve in ~0.4ms with zero wire packets.
              </p>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--color-text-main)", backgroundColor: "var(--bg-surface-recessed)", padding: "8px", borderRadius: "var(--radius-xs)" }}>
                Notice: This is our application cache, completely separate from OS or ISP caches.
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
            RFC 1035 HEADER FLAGS SPECIFICATION TABLE
            ------------------------------------------------------------------ */}
        <section>
          <div style={{ marginBottom: "16px" }}>
            <h2
              className="font-serif"
              style={{
                fontSize: "24px",
                fontWeight: 600,
                color: "var(--color-primary)",
                marginBottom: "6px",
              }}
            >
              RFC 1035 Wire Header Flags Reference
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>
              Exact bit definitions for the 12-byte standard DNS packet header.
            </p>
          </div>

          <div className="dns-table-wrapper">
            <table className="dns-table">
              <thead>
                <tr>
                  <th>FLAG</th>
                  <th>FULL NAME</th>
                  <th>WIDTH</th>
                  <th>VALUE IN OUR QUERIES</th>
                  <th>DESCRIPTION & SEMANTICS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700, color: "var(--color-primary)" }}>QR</td>
                  <td>Query / Response</td>
                  <td>1 bit</td>
                  <td>0 (Query) / 1 (Reply)</td>
                  <td>Distinguishes an outgoing query (0) from an incoming server response (1).</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, color: "var(--color-primary)" }}>AA</td>
                  <td>Authoritative Answer</td>
                  <td>1 bit</td>
                  <td>Set by server</td>
                  <td>1 indicates the answering nameserver is an authoritative owner of the domain zone.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, color: "var(--color-primary)" }}>TC</td>
                  <td>Truncated</td>
                  <td>1 bit</td>
                  <td>Checked in reply</td>
                  <td>1 indicates the response exceeded UDP packet payload limits, triggering TCP fallback.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, color: "var(--color-primary)" }}>RD</td>
                  <td>Recursion Desired</td>
                  <td>1 bit</td>
                  <td>0 (Iterative)</td>
                  <td>Always cleared to 0 in our iterative resolver to request referrals rather than recursive lookups.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, color: "var(--color-primary)" }}>RA</td>
                  <td>Recursion Available</td>
                  <td>1 bit</td>
                  <td>Set by server</td>
                  <td>Reported by the remote server to indicate whether it supports recursive resolution.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, color: "var(--color-primary)" }}>RCODE</td>
                  <td>Response Code</td>
                  <td>4 bits</td>
                  <td>Checked in reply</td>
                  <td>0: NOERROR · 3: NXDOMAIN (Non-existent) · 2: SERVFAIL · 5: REFUSED.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

