import { useState } from "react";

export const RECORD_TYPES = [
  { value: "A", hint: "the IPv4 address of the host" },
  { value: "AAAA", hint: "the IPv6 address of the host" },
  { value: "CNAME", hint: "the alias (canonical name) a host points to" },
  { value: "NS", hint: "the authoritative nameservers of the zone" },
  { value: "MX", hint: "the mail servers that accept email for the domain" },
  { value: "TXT", hint: "text records (SPF, verification tokens, etc.)" },
];

export default function SearchBar({ onSubmit, disabled = false }) {
  const [domain, setDomain] = useState("");
  const [recordType, setRecordType] = useState("A");
  const [error, setError] = useState("");

  const selected = RECORD_TYPES.find((t) => t.value === recordType);

  function handleSubmit(event) {
    event.preventDefault();
    const cleaned = domain.trim();
    if (!cleaned) {
      setError("Enter a domain, for example google.com");
      return;
    }
    setError("");
    onSubmit({ domain: cleaned, recordType });
  }

  return (
    <form className="search" onSubmit={handleSubmit} noValidate>
      <label className="sr-only" htmlFor="domain">Domain name</label>
      <input
        id="domain"
        type="text"
        value={domain}
        onChange={(e) => setDomain(e.target.value)}
        placeholder="google.com"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        autoFocus
        aria-invalid={error ? "true" : "false"}
        aria-describedby="domain-help"
      />

      <label className="sr-only" htmlFor="rtype">Record type</label>
      <select id="rtype" value={recordType} onChange={(e) => setRecordType(e.target.value)}>
        {RECORD_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.value}</option>
        ))}
      </select>

      <button type="submit" disabled={disabled}>TRACE DNS</button>

      <div id="domain-help" style={{ flexBasis: "100%" }}>
        {error ? (
          <p className="field-error" role="alert">{error}</p>
        ) : (
          <p className="hint">
            <code>{recordType}</code> asks for {selected.hint}.
          </p>
        )}
      </div>
    </form>
  );
}
