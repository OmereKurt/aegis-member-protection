export default function LandingPage() {
  return (
    <main className="page-wrap">
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-card">
            <div className="hero-eyebrow">Purpose-built workflow</div>

            <h1>
              A workflow layer for{" "}
              <span className="hero-highlight">
                suspected elder exploitation cases
              </span>
              .
            </h1>

            <p>
              Aegis gives credit unions a dedicated workflow to intake, triage,
              escalate, assign, document, and resolve suspected elder
              exploitation cases with more speed and consistency.
            </p>

            <p>
              Built for branch, contact center, and fraud operations teams that
              need cleaner case handling from first concern to final outcome.
            </p>

            <div className="hero-actions">
              <a href="/ops" className="button">
                Open Workspace
              </a>
              <a href="/cases/new" className="button button-secondary">
                Start New Intake
              </a>
            </div>

            <div className="hero-proof-row">
              <div className="hero-proof-pill">Operational workflow</div>
              <div className="hero-proof-pill">Structured case handling</div>
              <div className="hero-proof-pill">Source-unit visibility</div>
            </div>

            <div className="workspace-shortcuts">
              <a href="/ops" className="shortcut-card">
                <div className="shortcut-label">Workspace</div>
                <div className="shortcut-title">Operations queue</div>
                <div className="shortcut-desc">
                  Review, assign, escalate, and manage active cases.
                </div>
              </a>

              <a href="/reporting" className="shortcut-card">
                <div className="shortcut-label">Reporting</div>
                <div className="shortcut-title">Leadership visibility</div>
                <div className="shortcut-desc">
                  Track case activity, outcomes, and workflow patterns.
                </div>
              </a>

              <a href="/cases/new" className="shortcut-card">
                <div className="shortcut-label">Intake</div>
                <div className="shortcut-title">Create a new case</div>
                <div className="shortcut-desc">
                  Capture member context and start a structured review.
                </div>
              </a>
            </div>
          </div>

          <div className="hero-metrics">
            <div className="metric-card">
              <div className="metric-label">Designed for</div>
              <div className="metric-value">
                Fraud, risk, and branch operations leaders
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Workflow</div>
              <div className="metric-value">
                Intake → triage → escalation → assignment → closure
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Core teams</div>
              <div className="metric-value">
                Branch staff, contact center, and fraud operations
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">What Aegis is solving</h2>
        <p className="section-subtitle">
          The challenge is not awareness. It is operational consistency across
          intake, escalation, documentation, ownership, and reporting.
        </p>

        <div className="brand-grid">
          <div className="brand-panel">
            <h3>Without a structured workflow</h3>
            <div className="brand-list">
              <div className="brand-list-item">
                <div className="brand-list-mark">1</div>
                <div className="brand-list-text">
                  <strong>Cases start in too many places</strong>
                  <span>
                    Branch, contact center, and fraud teams often capture the
                    same issue differently.
                  </span>
                </div>
              </div>

              <div className="brand-list-item">
                <div className="brand-list-mark">2</div>
                <div className="brand-list-text">
                  <strong>Escalation becomes inconsistent</strong>
                  <span>
                    Teams do not always have a clear threshold for supervisor or
                    fraud review.
                  </span>
                </div>
              </div>

              <div className="brand-list-item">
                <div className="brand-list-mark">3</div>
                <div className="brand-list-text">
                  <strong>Management visibility stays limited</strong>
                  <span>
                    It becomes harder to track volume, ownership, and outcomes
                    in one place.
                  </span>
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
                  <span>
                    Capture member context, event details, and risk indicators
                    in a consistent way.
                  </span>
                </div>
              </div>

              <div className="brand-list-item">
                <div className="brand-list-mark">B</div>
                <div className="brand-list-text">
                  <strong>Guided case handling</strong>
                  <span>
                    Support staff with urgency logic, next steps, escalation
                    paths, and ownership.
                  </span>
                </div>
              </div>

              <div className="brand-list-item">
                <div className="brand-list-mark">C</div>
                <div className="brand-list-text">
                  <strong>Operational reporting</strong>
                  <span>
                    Show source-unit activity, case progress, and outcomes more
                    clearly.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">How the workflow works</h2>
        <p className="section-subtitle">
          Aegis helps teams move from first concern to documented resolution in
          a more consistent way.
        </p>

        <div className="process-row">
          <div className="process-step">
            <div className="process-step-number">1</div>
            <h3>Intake</h3>
            <p>
              Capture member context, suspicious activity, and structured risk
              indicators.
            </p>
          </div>

          <div className="process-step">
            <div className="process-step-number">2</div>
            <h3>Triage</h3>
            <p>
              Turn narratives into urgency, recommended actions, and escalation
              guidance.
            </p>
          </div>

          <div className="process-step">
            <div className="process-step-number">3</div>
            <h3>Assign</h3>
            <p>
              Route the case to the right owner and team with a cleaner
              operational handoff.
            </p>
          </div>

          <div className="process-step">
            <div className="process-step-number">4</div>
            <h3>Resolve</h3>
            <p>
              Document actions, outcomes, and workflow history for leadership
              visibility.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">What the product includes today</h2>
        <p className="section-subtitle">
          The current product is centered on day-to-day case operations, case
          review, intake, and reporting visibility.
        </p>

        <div className="visual-grid">
          <div className="visual-card">
            <div className="icon-badge dark">O</div>
            <h3>Operations dashboard</h3>
            <p>
              Search, filter, review, escalate, and assign cases across teams
              and source units.
            </p>
          </div>

          <div className="visual-card">
            <div className="icon-badge">C</div>
            <h3>Case workspace</h3>
            <p>
              Work each case with guidance, assignment controls, notes,
              timeline, and final outcome.
            </p>
          </div>

          <div className="visual-card">
            <div className="icon-badge green">R</div>
            <h3>Reporting</h3>
            <p>
              Review source-unit activity, outcomes, and workflow patterns in
              one place.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="cta-banner">
          <h2>Pilot program</h2>
          <p>
            We are working with a small number of institutions to refine the
            workflow for suspected elder exploitation case operations.
          </p>

          <div className="hero-actions">
            <a href="/pilot" className="button">
              Explore Pilot Program
            </a>
            <a href="/ops" className="button button-secondary">
              Open Workspace
            </a>
          </div>

          <div className="cta-mini-note">
            Current focus: workflow fit, operator feedback, and product
            refinement.
          </div>
        </div>
      </section>

      <div className="footer-note">
        Early product focused on workflow standardization for member protection
        teams.
      </div>
    </main>
  );
}