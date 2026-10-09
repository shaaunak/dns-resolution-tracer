import { useState } from "react";

const RECORD_TYPES = [
  { value: "A", label: "A", hint: "IPv4 Host Address", desc: "Maps domain to 32-bit IPv4 address" },
  { value: "AAAA", label: "AAAA", hint: "IPv6 Host Address", desc: "Maps domain to 128-bit IPv6 address" },
  { value: "CNAME", label: "CNAME", hint: "Canonical Name", desc: "Resolves domain alias target" },
  { value: "NS", label: "NS", hint: "Name Servers", desc: "Queries delegated zone nameservers" },
  { value: "MX", label: "MX", hint: "Mail Exchange", desc: "Locates mail servers handling email" },
  { value: "TXT", label: "TXT", hint: "Text Record", desc: "SPF, DKIM, and verification strings" },
];

export default function SearchBar({ onSubmit, disabled = false, initialDomain = "" }) {
  const [domain, setDomain] = useState(initialDomain);
  const [recordType, setRecordType] = useState("A");
  const [error, setError] = useState("");

  const selected = RECORD_TYPES.find((t) => t.value === recordType) || RECORD_TYPES[0];

  function handleSubmit(event) {
    event.preventDefault();
    const cleaned = domain.trim();
    if (!cleaned) {
      setError("Please enter a domain name (e.g. google.com or cloudflare.com)");
      return;
    }
    setError("");
    onSubmit({ domain: cleaned, recordType });
  }

  function handleQuickSelect(sampleDomain, type) {
    setDomain(sampleDomain);
    if (type) setRecordType(type);
    setError("");
    onSubmit({ domain: sampleDomain, recordType: type || recordType });
  }

  return (
    <div className="search-cockpit">
      <form className="search-form" onSubmit={handleSubmit} noValidate>
        <div className="search-input-wrapper">
          <span className="search-prefix-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>

          <label className="sr-only" htmlFor="domain">Domain name</label>
          <input
            id="domain"
            type="text"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              if (error) setError("");
            }}
            placeholder="Enter hostname (e.g. google.com, github.com)..."
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={error ? "true" : "false"}
            aria-describedby="domain-help"
            className="search-input"
          />

          {domain && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setDomain("")}
              aria-label="Clear domain input"
            >
              ✕
            </button>
          )}
        </div>

        <div className="search-type-wrapper">
          <label className="sr-only" htmlFor="rtype">Record type</label>
          <div className="custom-select-wrap">
            <select
              id="rtype"
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className="record-select"
            >
              {RECORD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.value} ({t.hint})
                </option>
              ))}
            </select>
            <span className="select-arrow" aria-hidden="true">▾</span>
          </div>
        </div>

        <button type="submit" className="trace-submit-btn" disabled={disabled}>
          <span className="trace-btn-content">
            {disabled ? (
              <>
                <span className="btn-spinner" aria-hidden="true" />
                <span>Tracing...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Trace Path</span>
                <span className="kbd-shortcut">↵</span>
              </>
            )}
          </span>
        </button>
      </form>

      <div className="search-meta-bar" id="domain-help">
        {error ? (
          <div className="field-error" role="alert">
            <span className="error-dot" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="search-hint">
            <span className="hint-pill">RECORD TYPE: <strong>{recordType}</strong></span>
            <span className="hint-desc">{selected.desc}</span>
          </div>
        )}

        {/* Quick Presets */}
        <div className="quick-presets">
          <span className="presets-label">Presets:</span>
          <button
            type="button"
            className="preset-btn"
            onClick={() => handleQuickSelect("google.com", "A")}
            disabled={disabled}
          >
            google.com
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => handleQuickSelect("cloudflare.com", "AAAA")}
            disabled={disabled}
          >
            cloudflare.com [AAAA]
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => handleQuickSelect("www.bbc.co.uk", "A")}
            disabled={disabled}
          >
            bbc.co.uk [CNAME]
          </button>
        </div>
      </div>
    </div>
  );
}
