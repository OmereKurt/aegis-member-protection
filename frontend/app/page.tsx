export default function LandingPage() {
  return (
    <main className="page-wrap">
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-card">
            <div className="hero-eyebrow">Built for credit union operations</div>

            <h1>
              Suspected elder exploitation cases still break down in{" "}
              <span className="hero-highlight">handoffs, notes, and memory</span>
              .
            </h1>

            <p>
              Aegis gives credit unions a dedicated workflow to intake concerns,
              assess urgency, escalate faster, document actions, and keep
              ownership visible from first concern to final outcome.
            </p>

            <p>
              Built for the cases generic queues, spreadsheets, and ad hoc notes
              handle badly.
            </p>

            <div className="hero-actions">
              <a href="/ops" className="button">
                Open Workspace
              </a>
              <a href="/reporting" className="button button-secondary">
                View Reporting
              </a>
            </div>

            <div className="hero-proof-row">
              <div className="hero-proof-pill">Operational workflow</div>
              <div className="hero-proof-pill">Cross-team case handling</div>
              <div className="hero-proof-pill">Source-unit visibility</div>
            </div>

            <div className="workspace-shortcuts">
              <a href="/ops" className="shortcut-card">
                <div className="shortcut-label">Workspace</div>
                <div className="shortcut-title">Active case operations</div>
                <div className="shortcut-desc">
                  Review the queue, select a case, and act from one workspace.
                </div>
              </a>

              <a href="/reporting" className="shortcut-card">
                <div className="shortcut-label">Reporting</div>
                <div className="shortcut-title">Management visibility</div>
                <div className="shortcut-desc">
                  Review volume, source-unit mix, outcomes, and workflow
                  bottlenecks.
                </div>
              </a>

              <a href="/cases/new" className="shortcut-card">
                <div className="shortcut-label">Intake</div>
                <div className="shortcut-title">Structured case entry</div>
                <div className="shortcut-desc">
                  Capture observations, member context, and escalation signals in
                  a consistent format.
                </div>
              </a>
            </div>
          </div>

          <div className="hero-metrics">
            <div className="metric-card">
              <div className="metric-label">Why this is hard</div>
              <div className="metric-value">
                Concern starts in one channel, decision happens in another
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">What gets lost</div>
              <div className="metric-value">
                Staff observations, urgency, and ownership across handoffs
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">What Aegis adds</div>
              <div className="metric-value">
                A dedicated operating workflow for a high-friction case type
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="split-highlight">
          <div className="highlight-panel">
            <h3>Generic case tools were not built for this workflow.</h3>
            <p>
              Suspected elder exploitation cases often begin with partial
              context, staff observations, unusual urgency, and sensitive
              cross-team escalation. The problem is not simply storing a case.
              The problem is creating a workflow operators can actually use under
              pressure.
            </p>

            <div className="mini-pills">
              <div className="mini-pill">Branch-originated concerns</div>
              <div className="mini-pill">Contact center escalation</div>
              <div className="mini-pill">Cross-team ownership</div>
              <div className="mini-pill">Audit-ready documentation</div>
            </div>
          </div>

          <div className="highlight-stats">
            <div className="highlight-stat">
              <div className="highlight-stat-label">The real pain</div>
              <div className="highlight-stat-value">
                inconsistent intake and escalation
              </div>
            </div>

            <div className="highlight-stat">
              <div className="highlight-stat-label">What leaders need</div>
              <div className="highlight-stat-value">
                clear visibility by source unit, owner, and outcome
              </div>
            </div>

            <div className="highlight-stat">
              <div className="highlight-stat-label">What operators need</div>
              <div className="highlight-stat-value">
                one place to review, act, document, and hand off
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Where the workflow breaks today</h2>
        <p className="section-subtitle">
          Most institutions already have alerts, notes, and case tools. What
          they do not have is a workflow designed specifically for suspected
          member exploitation handling.
        </p>

        <div className="compact-points">
          <div className="compact-point">
            <div className="compact-point-mark">1</div>
            <div className="compact-point-text">
              <strong>Concern starts in fragmented channels</strong>
              <span>
                Branch staff, contact center teams, and digital channels all
                capture different parts of the same problem.
              </span>
            </div>
          </div>

          <div className="compact-point">
            <div className="compact-point-mark">2</div>
            <div className="compact-point-text">
              <strong>Escalation becomes judgment-heavy</strong>
              <span>
                Operators often rely on memory, scattered notes, and ad hoc
                handoff decisions instead of a clearer escalation path.
              </span>
            </div>
          </div>

          <div className="compact-point">
            <div className="compact-point-mark">3</div>
            <div className="compact-point-text">
              <strong>Ownership and visibility weaken over time</strong>
              <span>
                Leaders can count cases, but it is harder to see where they
                started, how they moved, and where the workflow slowed down.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">How Aegis works in practice</h2>
        <p className="section-subtitle">
          Aegis gives teams a cleaner operating model from first concern to
          documented resolution.
        </p>

        <div className="process-row">
          <div className="process-step">
            <div className="process-step-number">1</div>
            <h3>Intake</h3>
            <p>
              Capture member context, observations, suspicious activity, and
              structured risk indicators.
            </p>
          </div>

          <div className="process-step">
            <div className="process-step-number">2</div>
            <h3>Triage</h3>
            <p>
              Turn narrative concerns into urgency, recommended actions, and
              escalation guidance.
            </p>
          </div>

          <div className="process-step">
            <div className="process-step-number">3</div>
            <h3>Operate</h3>
            <p>
              Assign owners, document actions, review timelines, and keep the
              case moving in one workspace.
            </p>
          </div>

          <div className="process-step">
            <div className="process-step-number">4</div>
            <h3>Report</h3>
            <p>
              Give management visibility into source-unit distribution,
              bottlenecks, case outcomes, and workflow patterns.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">What changes when the workflow is structured</h2>
        <p className="section-subtitle">
          The value is not just better case storage. It is faster handling,
          stronger consistency, and better operational visibility.
        </p>

        <div className="visual-grid">
          <div className="visual-card">
            <div className="icon-badge dark">O</div>
            <h3>Operators move faster</h3>
            <p>
              Teams can review, escalate, assign, and document from one
              workspace instead of piecing the process together manually.
            </p>
          </div>

          <div className="visual-card">
            <div className="icon-badge">V</div>
            <h3>Visibility improves</h3>
            <p>
              Source-unit activity, ownership, and workflow progression stay
              visible across the case lifecycle.
            </p>
          </div>

          <div className="visual-card">
            <div className="icon-badge green">M</div>
            <h3>Management gets signal</h3>
            <p>
              Reporting becomes more useful when leaders can see where cases
              originate, where they escalate, and where they stall.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="cta-banner">
          <h2>A dedicated workflow for a workflow that is usually improvised</h2>
          <p>
            Aegis is designed to make suspected elder exploitation handling feel
            like a real operating system, not a patchwork of notes, queues, and
            manual follow-up.
          </p>

          <div className="hero-actions">
            <a href="/ops" className="button">
              Open Workspace
            </a>
            <a href="/cases/new" className="button button-secondary">
              Start New Intake
            </a>
          </div>

          <div className="cta-mini-note">
            Current focus: workflow fit, operator usability, and early pilot
            readiness.
          </div>
        </div>
      </section>

      <div className="footer-note">
        Early product focused on turning a high-friction case type into a
        structured operational workflow.
      </div>
    </main>
  );
}