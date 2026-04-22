export default function LandingPage() {
  return (
    <main className="page-wrap">
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-card">
            <div className="hero-eyebrow">Aegis Member Protection</div>
            <h1>
              A workflow layer for <span className="hero-highlight">suspected elder exploitation cases</span>.
            </h1>
            <p>
              Aegis helps credit unions and regional banks intake, triage, escalate,
              assign, document, and review member protection cases with more consistency.
            </p>
            <p>
              The focus is not generic fraud software. The focus is one operational wedge:
              helping teams respond before vulnerable members lose funds.
            </p>

            <div className="hero-actions">
              <a href="/pilot" className="button">Become a Design Partner</a>
              <a href="/ops" className="button button-secondary">View Product Workspace</a>
            </div>

            <div className="hero-proof-row">
              <div className="hero-proof-pill">Built for operational teams</div>
              <div className="hero-proof-pill">Structured case handling</div>
              <div className="hero-proof-pill">Source-unit visibility</div>
            </div>
          </div>

          <div className="hero-metrics">
            <div className="metric-card">
              <div className="metric-label">Best-fit buyers</div>
              <div className="metric-value">Fraud, risk, and branch operations leaders</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Core workflow</div>
              <div className="metric-value">Intake → triage → escalation → assignment → closure</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Primary users</div>
              <div className="metric-value">Branch staff, contact center, fraud operations</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">What Aegis is solving</h2>
        <p className="section-subtitle">
          Many institutions already recognize the problem. The gap is operational consistency:
          intake, escalation, documentation, ownership, and reporting are often too fragmented.
        </p>

        <div className="brand-grid">
          <div className="brand-panel">
            <h3>Without a structured workflow</h3>
            <div className="brand-list">
              <div className="brand-list-item">
                <div className="brand-list-mark">1</div>
                <div className="brand-list-text">
                  <strong>Cases start in too many places</strong>
                  <span>Branch, contact center, and fraud teams may all see the issue differently.</span>
                </div>
              </div>

              <div className="brand-list-item">
                <div className="brand-list-mark">2</div>
                <div className="brand-list-text">
                  <strong>Escalation becomes inconsistent</strong>
                  <span>Teams do not always agree on when a case needs supervisor or fraud review.</span>
                </div>
              </div>

              <div className="brand-list-item">
                <div className="brand-list-mark">3</div>
                <div className="brand-list-text">
                  <strong>Management visibility is weak</strong>
                  <span>It is harder to see case volume, ownership, and final outcomes in one place.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="brand-panel">
            <h3>What Aegis adds</h3>
            <div className="brand-list">
              <div className="brand-list-item">
                <div className="brand-list-mark">A</div>
                <div className="brand-list-text">
                  <strong>Structured intake</strong>
                  <span>Capture member context, suspicious event details, and risk indicators consistently.</span>
                </div>
              </div>

              <div className="brand-list-item">
                <div className="brand-list-mark">B</div>
                <div className="brand-list-text">
                  <strong>Guided case handling</strong>
                  <span>Support staff with urgency logic, next actions, escalation paths, and ownership.</span>
                </div>
              </div>

              <div className="brand-list-item">
                <div className="brand-list-mark">C</div>
                <div className="brand-list-text">
                  <strong>Operational reporting</strong>
                  <span>Show source-unit activity, outcomes, and workflow patterns for managers.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">How the workflow works</h2>
        <p className="section-subtitle">
          Aegis is designed to help teams move from first concern to documented resolution in a more structured way.
        </p>

        <div className="process-row">
          <div className="process-step">
            <div className="process-step-number">1</div>
            <h3>Intake</h3>
            <p>Capture member context, suspicious activity, and structured risk indicators.</p>
          </div>

          <div className="process-step">
            <div className="process-step-number">2</div>
            <h3>Triage</h3>
            <p>Turn narratives into urgency, staff guidance, and escalation recommendations.</p>
          </div>

          <div className="process-step">
            <div className="process-step-number">3</div>
            <h3>Assign</h3>
            <p>Route the case to the right owner and team with a clearer operational handoff.</p>
          </div>

          <div className="process-step">
            <div className="process-step-number">4</div>
            <h3>Resolve</h3>
            <p>Document actions, outcomes, and workflow history for leadership visibility.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">What the product includes today</h2>
        <div className="visual-grid">
          <div className="visual-card">
            <div className="icon-badge dark">O</div>
            <h3>Operations dashboard</h3>
            <p>Search, filter, review, escalate, and assign cases across teams and source units.</p>
          </div>

          <div className="visual-card">
            <div className="icon-badge">C</div>
            <h3>Case workspace</h3>
            <p>Work each case with guidance, assignment controls, notes, timeline, and final outcome.</p>
          </div>

          <div className="visual-card">
            <div className="icon-badge green">R</div>
            <h3>Reporting</h3>
            <p>Review source-unit activity, outcomes, and workflow patterns in one place.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="cta-banner">
          <h2>Looking for early design partners</h2>
          <p>
            We are working with a small number of institutions to tighten the workflow around suspected elder financial exploitation cases.
          </p>

          <div className="hero-actions">
            <a href="/pilot" className="button">Explore the Design Partner Program</a>
            <a href="/reporting" className="button button-secondary">See Reporting View</a>
          </div>

          <div className="cta-mini-note">
            Current stage: early product, focused on workflow fit and operational feedback.
          </div>
        </div>
      </section>

      <div className="footer-note">
        Early product focused on workflow standardization for member protection teams.
      </div>
    </main>
  );
}
