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
            <p>
              Instead of fragmented branch notes, inconsistent escalation, and weak visibility,
              teams get one operating layer for member protection case handling.
            </p>

            <div className="hero-actions">
              <a href="/pilot" className="button">Request Design Partner Access</a>
              <a href="/ops" className="button button-secondary">View Product Workspace</a>
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
        <h2 className="section-title">Why this product exists</h2>
        <p className="section-subtitle">
          Financial institutions already need a more consistent way to handle suspected elder
          exploitation cases. Aegis is designed to support the operational work between initial concern
          and final resolution.
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Standardized intake</h3>
            <p>
              Capture member context, suspicious event details, and structured risk indicators from
              the branch, contact center, fraud operations, or other intake points.
            </p>
          </div>

          <div className="feature-card">
            <h3>Operational guidance</h3>
            <p>
              Turn narratives into urgency, recommended next actions, escalation paths, ownership,
              and case history.
            </p>
          </div>

          <div className="feature-card">
            <h3>Management visibility</h3>
            <p>
              Give leaders a lightweight reporting layer for source-unit volume, case outcomes,
              ownership, and workflow maturity.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">What the product includes today</h2>
        <p className="section-subtitle">
          The current product is designed around one clear use case: helping teams handle suspected
          elder financial exploitation cases more consistently.
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Operations dashboard</h3>
            <p>
              Search, filter, review, escalate, and assign cases across source units and teams.
            </p>
          </div>

          <div className="feature-card">
            <h3>Case workspace</h3>
            <p>
              Work each case with staff guidance, assignment controls, notes, timelines, and
              documented outcomes.
            </p>
          </div>

          <div className="feature-card">
            <h3>Management reporting</h3>
            <p>
              Review source-unit activity, closed-case outcomes, and protected-vs-lost patterns
              in one place.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Current focus</h2>
        <p className="section-subtitle">
          Aegis is being shaped with early design-partner feedback from the exact teams who would
          use and manage this workflow.
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
