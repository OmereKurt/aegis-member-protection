export default function LandingPage() {
  return (
    <main className="page-wrap">
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-card">
            <div className="page-kicker">Member Protection Workflow</div>
            <h1>Help staff intervene before vulnerable members lose funds.</h1>
            <p>
              Aegis gives credit unions and regional banks a structured workflow to intake,
              triage, escalate, document, and review suspected elder financial exploitation cases.
            </p>

            <div className="hero-actions">
              <a href="/pilot" className="button">Request Design Partner Access</a>
              <a href="/ops" className="button button-secondary">View Product Workspace</a>
            </div>

            <div className="accent-band">
              <div className="visual-grid">
                <div className="visual-card">
                  <div className="icon-badge">⚡</div>
                  <h3>Faster intake</h3>
                  <p>Capture suspicious cases quickly from branch, contact center, or fraud operations.</p>
                </div>

                <div className="visual-card">
                  <div className="icon-badge green">✓</div>
                  <h3>Clearer handling</h3>
                  <p>Give staff a guided workflow instead of scattered notes and ad hoc escalation.</p>
                </div>

                <div className="visual-card">
                  <div className="icon-badge amber">↗</div>
                  <h3>Better visibility</h3>
                  <p>Show managers case volume, ownership, and outcomes across the workflow.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-metrics">
            <div className="metric-card">
              <div className="metric-label">Built for</div>
              <div className="metric-value">Credit unions and regional banks</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Core workflow</div>
              <div className="metric-value">Intake → triage → escalation → documentation → closure</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Primary users</div>
              <div className="metric-value">Branch staff, contact center, fraud operations</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">How the workflow works</h2>
        <p className="section-subtitle">
          Aegis is designed to help staff move from first concern to documented resolution in a more structured way.
        </p>

        <div className="process-row">
          <div className="process-step">
            <div className="process-step-number">1</div>
            <h3>Intake</h3>
            <p>Capture member context, suspicious activity, and risk indicators.</p>
          </div>

          <div className="process-step">
            <div className="process-step-number">2</div>
            <h3>Triage</h3>
            <p>Turn narratives into urgency, guidance, and recommended next actions.</p>
          </div>

          <div className="process-step">
            <div className="process-step-number">3</div>
            <h3>Escalate</h3>
            <p>Route cases to the right owner or team with more consistency.</p>
          </div>

          <div className="process-step">
            <div className="process-step-number">4</div>
            <h3>Resolve</h3>
            <p>Document actions, notes, and outcomes for management visibility.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="split-highlight">
          <div className="highlight-panel">
            <h3>Not another generic fraud dashboard</h3>
            <p>
              Aegis is focused on one operational wedge: suspected elder financial exploitation case handling.
            </p>

            <div className="mini-pills">
              <div className="mini-pill">Branch intake</div>
              <div className="mini-pill">Fraud ops</div>
              <div className="mini-pill">Case workflow</div>
              <div className="mini-pill">Reporting</div>
            </div>
          </div>

          <div className="highlight-stats">
            <div className="highlight-stat">
              <div className="highlight-stat-label">Today’s product shape</div>
              <div className="highlight-stat-value">Ops dashboard</div>
            </div>
            <div className="highlight-stat">
              <div className="highlight-stat-label">Core workspace</div>
              <div className="highlight-stat-value">Case handling + notes + closure</div>
            </div>
            <div className="highlight-stat">
              <div className="highlight-stat-label">Leadership layer</div>
              <div className="highlight-stat-value">Operational reporting</div>
            </div>
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
            <p>Work each case with guidance, ownership controls, notes, timeline, and final outcome.</p>
          </div>

          <div className="visual-card">
            <div className="icon-badge green">R</div>
            <h3>Reporting</h3>
            <p>Review source-unit activity, outcomes, and workflow patterns in one place.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Current focus</h2>
        <p className="section-subtitle">
          We are shaping the product with early design-partner feedback from teams that would actually use and manage this workflow.
        </p>

        <div className="hero-actions">
          <a href="/pilot" className="button">Explore the Design Partner Program</a>
          <a href="/reporting" className="button button-secondary">See Reporting View</a>
        </div>
      </section>

      <div className="footer-note">
        Early product focused on workflow standardization for member protection teams.
      </div>
    </main>
  );
}
