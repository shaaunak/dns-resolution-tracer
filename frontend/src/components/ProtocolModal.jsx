export default function ProtocolModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title-group">
            <span className="modal-badge">RFC 1034 / 1035</span>
            <h3 className="modal-title">DNS Resolution & Protocol Reference</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <section className="modal-sec">
            <h4 className="modal-sec-title">Iterative vs Recursive Resolution</h4>
            <p className="modal-text">
              In standard browsing, your operating system asks a <strong>Recursive Resolver</strong> (like 8.8.8.8 or 1.1.1.1) to do all the work and return the final answer.
              This project acts as an <strong>Iterative Resolver</strong>: it starts at the DNS root servers (<code>[a-m].root-servers.net</code>), follows referral responses down to the Top-Level Domain (TLD) servers, and finally queries the Authoritative nameserver.
            </p>
          </section>

          <section className="modal-sec">
            <h4 className="modal-sec-title">Supported Record Types</h4>
            <div className="modal-grid">
              <div className="modal-grid-item">
                <span className="code-chip">A</span>
                <div>
                  <strong>Host Address (IPv4)</strong>
                  <p>Maps a hostname to an IPv4 32-bit address (e.g. 142.250.190.46).</p>
                </div>
              </div>
              <div className="modal-grid-item">
                <span className="code-chip">AAAA</span>
                <div>
                  <strong>Host Address (IPv6)</strong>
                  <p>Maps a hostname to an IPv6 128-bit address (e.g. 2607:f8b0:4005::200e).</p>
                </div>
              </div>
              <div className="modal-grid-item">
                <span className="code-chip">CNAME</span>
                <div>
                  <strong>Canonical Name</strong>
                  <p>Specifies an alias domain that redirects the resolver to the true target domain.</p>
                </div>
              </div>
              <div className="modal-grid-item">
                <span className="code-chip">NS</span>
                <div>
                  <strong>Authoritative Name Server</strong>
                  <p>Delegates a DNS zone to an authoritative nameserver.</p>
                </div>
              </div>
              <div className="modal-grid-item">
                <span className="code-chip">MX</span>
                <div>
                  <strong>Mail Exchange</strong>
                  <p>Specifies the mail server responsible for accepting emails for the domain.</p>
                </div>
              </div>
              <div className="modal-grid-item">
                <span className="code-chip">TXT</span>
                <div>
                  <strong>Text Records</strong>
                  <p>Arbitrary human/machine-readable text used for SPF, DKIM, and site verification.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="modal-sec">
            <h4 className="modal-sec-title">Response Status Codes (RCODE)</h4>
            <div className="modal-grid">
              <div className="modal-grid-item">
                <span className="status-code-chip ok">NOERROR (0)</span>
                <div>No error condition; zone query succeeded.</div>
              </div>
              <div className="modal-grid-item">
                <span className="status-code-chip warn">NXDOMAIN (3)</span>
                <div>Non-existent domain; authoritative server confirmed domain does not exist.</div>
              </div>
              <div className="modal-grid-item">
                <span className="status-code-chip err">SERVFAIL (2)</span>
                <div>Server failure; nameserver encountered internal or zone error.</div>
              </div>
              <div className="modal-grid-item">
                <span className="status-code-chip err">REFUSED (5)</span>
                <div>Server refused to perform query for policy/security reasons.</div>
              </div>
            </div>
          </section>
        </div>

        <div className="modal-foot">
          <button type="button" className="ghost-btn" onClick={onClose}>
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
}

