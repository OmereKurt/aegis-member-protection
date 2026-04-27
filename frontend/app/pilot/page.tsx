import Link from "next/link";

const partnerProfiles = [
  "Credit unions",
  "Regional banks",
  "Fraud operations teams",
  "Branch operations leaders",
  "Contact center leaders",
  "Member protection / vulnerable adult teams",
];

const validationAreas = [
  "Structured intake",
  "Explainable case intelligence",
  "Guided intervention playbook",
  "Action history",
  "Closure / outcome tracking",
  "Management reporting",
];

const pilotSteps = [
  "Workflow discovery",
  "Sample case configuration",
  "Team feedback sessions",
  "Scenario and data review",
  "Reporting validation",
  "Pilot success review",
];

const successCriteria = [
  "Faster case triage",
  "Clearer ownership handoff",
  "More consistent intervention documentation",
  "Better visibility into source units and outcomes",
  "Stronger management reporting",
];

const feedbackNeeds = [
  "Existing workflow pain points",
  "Example case paths",
  "Escalation rules",
  "Reporting needs",
  "Intake friction",
  "Closure / outcome definitions",
];

export default function PilotPage() {
  return (
    <main className="page-wrap pilot-console-page workspace-shell">
      <section className="pilot-hero console-panel">
        <div className="pilot-hero-copy">
          <div className="page-kicker">Design partner program</div>
          <h1>Help shape the member protection workflow layer for suspected elder exploitation cases.</h1>
          <p>
            Aegis is looking for design partners at credit unions and regional
            banks to validate a practical operating model for intake,
            intervention, outcome tracking, and management reporting.
          </p>
          <div className="home-action-row">
            <Link href="/reporting" className="button">
              View Reporting Console
            </Link>
            <Link href="/ops" className="button button-secondary">
              Open Operations
            </Link>
            <Link href="/cases/new" className="button button-secondary">
              Start Intake
            </Link>
          </div>
        </div>

        <aside className="pilot-fit-panel inspector-panel">
          <div className="home-panel-header">
            <div>
              <div className="page-kicker">Best fit</div>
              <h2>Operational design partners</h2>
            </div>
          </div>
          <div className="pilot-list-grid">
            {partnerProfiles.map((item) => (
              <div className="pilot-list-row" key={item}>
                <span />
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="pilot-console-grid">
        <div className="console-panel">
          <div className="home-panel-header">
            <div>
              <div className="page-kicker">Pilot validation</div>
              <h2>Workflow areas to test with real operators</h2>
            </div>
          </div>
          <div className="pilot-list-grid two-column">
            {validationAreas.map((item) => (
              <div className="pilot-list-row" key={item}>
                <span />
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="console-panel">
          <div className="home-panel-header">
            <div>
              <div className="page-kicker">Success criteria</div>
              <h2>What a useful pilot should prove</h2>
            </div>
          </div>
          <div className="pilot-list-grid">
            {successCriteria.map((item) => (
              <div className="pilot-list-row" key={item}>
                <span />
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="console-panel pilot-structure-panel">
        <div className="home-panel-header">
          <div>
            <div className="page-kicker">Pilot structure</div>
            <h2>A practical evaluation path</h2>
          </div>
        </div>
        <div className="pilot-step-row">
          {pilotSteps.map((step, index) => (
            <div className="pilot-step" key={step}>
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="pilot-console-grid">
        <div className="console-panel">
          <div className="home-panel-header">
            <div>
              <div className="page-kicker">What Aegis needs</div>
              <h2>Feedback that makes the workflow sharper</h2>
            </div>
          </div>
          <div className="pilot-feedback-table">
            {feedbackNeeds.map((item) => (
              <div className="reporting-row" key={item}>
                <div className="reporting-row-label">{item}</div>
                <div className="muted">Operational examples, current-state constraints, and review comments.</div>
              </div>
            ))}
          </div>
        </div>

        <div className="console-panel pilot-cta-panel">
          <div className="page-kicker">Next step</div>
          <h2>Evaluate the workflow with realistic member protection scenarios.</h2>
          <p>
            Use Operations, Intake, and Reporting to review how Aegis handles
            the end-to-end member protection workflow.
          </p>
          <div className="home-action-row">
            <Link href="/ops" className="button">
              Open Operations
            </Link>
            <Link href="/cases/new" className="button button-secondary">
              Start Intake
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
