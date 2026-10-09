export default function EducationalPrimer({ onSelectSample, disabled = false }) {
  const SAMPLES = [
    {
      domain: "google.com",
      type: "A",
      desc: "Standard IPv4 root-to-authoritative traversal",
      tag: "Direct A Record",
      badgeClass: "badge-blue",
    },
    {
      domain: "wikipedia.org",
      type: "AAAA",
      desc: "IPv6 record query traversing .org gTLD",
      tag: "IPv6 Query",
      badgeClass: "badge-purple",
    },
    {
      domain: "www.bbc.co.uk",
      type: "A",
      desc: "Multi-level ccTLD (.uk -> .co.uk) with CNAME alias",
      tag: "CNAME / ccTLD",
      badgeClass: "badge-amber",
    },
    {
      domain: "github.com",
      type: "MX",
      desc: "Mail exchange routing records for domain",
      tag: "Mail Exchange",
      badgeClass: "badge-emerald",
    },
  ];

  const HIERARCHY_STEPS = [
    {
      level: "01",
      title: "Root Zone (.)",
      host: "13 Named Clusters (a.root-servers.net to m...)",
      desc: "Directs recursive query to the appropriate Top-Level Domain (TLD) nameservers.",
      icon: "🌐",
    },
    {
      level: "02",
      title: "TLD Zone (.com / .org)",
      host: "gTLD & ccTLD Registries",
      desc: "Answers with NS delegation records pointing to the domain's authoritative servers.",
      icon: "🏢",
    },
    {
      level: "03",
      title: "Authoritative Zone",
      host: "Domain Nameservers (ns1.example.com)",
      desc: "Holds the source of truth DNS zone files and returns the final Answer RRset.",
      icon: "⚡",
    },
  ];

  return (
    <div className="primer-container">
      {/* Quick Launch Samples */}
      <div className="primer-section">
        <div className="primer-header">
          <div className="primer-tag">Quick Start Traces</div>
          <h3 className="primer-title">Explore Real DNS Traversal Scenarios</h3>
          <p className="primer-subtitle">
            Select a pre-configured domain to trace real-time iterative packet resolution across the global root server network.
          </p>
        </div>

        <div className="samples-grid">
          {SAMPLES.map((sample) => (
            <button
              key={`${sample.domain}-${sample.type}`}
              type="button"
              className="sample-card"
              disabled={disabled}
              onClick={() => onSelectSample({ domain: sample.domain, recordType: sample.type })}
            >
              <div className="sample-card-head">
                <span className={`sample-badge ${sample.badgeClass}`}>{sample.tag}</span>
                <span className="sample-arrow" aria-hidden="true">→</span>
              </div>
              <div className="sample-domain">
                <span>{sample.domain}</span>
                <span className="sample-type-chip">{sample.type}</span>
              </div>
              <p className="sample-desc">{sample.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* DNS Architecture Concept */}
      <div className="primer-architecture">
        <div className="primer-tag">Protocol Architecture</div>
        <h3 className="primer-title">How Iterative DNS Resolution Works</h3>
        <p className="primer-subtitle">
          Unlike recursive resolvers that return a final result directly, this tool performs raw iterative queries from the top of the DNS tree downwards.
        </p>

        <div className="hierarchy-grid">
          {HIERARCHY_STEPS.map((step) => (
            <div key={step.level} className="hierarchy-card">
              <div className="hierarchy-step-num">{step.level}</div>
              <div className="hierarchy-icon">{step.icon}</div>
              <h4 className="hierarchy-name">{step.title}</h4>
              <div className="hierarchy-host">{step.host}</div>
              <p className="hierarchy-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

