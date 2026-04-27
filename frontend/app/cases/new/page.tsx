"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createCase, updateCaseNotes } from "../../lib/cases";

type IntakeState = {
  memberIdentifier: string;
  memberName: string;
  ageBand: string;
  sourceUnit: string;
  potentiallyVulnerableAdult: boolean;
  trustedContactAvailable: boolean;
  trustedContactName: string;
  trustedContactPhone: string;
  intakeChannel: string;
  transactionType: string;
  potentialLossAmount: string;
  fundsMayHaveLeft: boolean;
  memberStillOnPhoneWithScammer: boolean;
  newPayeeOrDestination: boolean;
  toldToKeepSecret: boolean;
  coachedOrPressured: boolean;
  unusualWithdrawalPattern: boolean;
  staffObservations: string;
  operatorNotes: string;
};

const LEGACY_DRAFT_STORAGE_KEY = "aegis-intake-draft";
const DRAFT_STORAGE_KEY = "aegis-intake-draft-v2";
const initialState: IntakeState = {
  memberIdentifier: "",
  memberName: "",
  ageBand: "Unknown",
  sourceUnit: "",
  potentiallyVulnerableAdult: false,
  trustedContactAvailable: false,
  trustedContactName: "",
  trustedContactPhone: "",
  intakeChannel: "",
  transactionType: "",
  potentialLossAmount: "",
  fundsMayHaveLeft: false,
  memberStillOnPhoneWithScammer: false,
  newPayeeOrDestination: false,
  toldToKeepSecret: false,
  coachedOrPressured: false,
  unusualWithdrawalPattern: false,
  staffObservations: "",
  operatorNotes: "",
};

const sampleState: IntakeState = {
  memberIdentifier: "CU-00421",
  memberName: "Evelyn Carter",
  ageBand: "70-79",
  sourceUnit: "Downtown Branch",
  potentiallyVulnerableAdult: true,
  trustedContactAvailable: true,
  trustedContactName: "Michael Carter",
  trustedContactPhone: "555-222-1188",
  intakeChannel: "Branch",
  transactionType: "Wire",
  potentialLossAmount: "18500",
  fundsMayHaveLeft: false,
  memberStillOnPhoneWithScammer: true,
  newPayeeOrDestination: true,
  toldToKeepSecret: true,
  coachedOrPressured: true,
  unusualWithdrawalPattern: true,
  staffObservations:
    "Branch staff reported repeated cashier's check requests tied to a newly introduced online contact. The member appeared uncertain about transaction purpose and deferred to outside instruction.",
  operatorNotes:
    "High-friction case pattern. Recommend immediate review, member callback support, and fraud-ops coordination before transaction completion.",
};

const ageBands = ["Unknown", "Under 60", "60-69", "70-79", "80-89", "90+"];
const sourceUnits = [
  "Downtown Branch",
  "North Branch",
  "Call Center",
  "Digital Banking",
  "Fraud Queue",
];
const intakeChannels = ["Branch", "Phone", "Digital", "Fraud Referral"];
const transactionTypes = [
  "Wire",
  "Cashier's Check",
  "ACH",
  "Cash Withdrawal",
  "Card Activity",
];

const stepSections = [
  { id: "member-context", number: 1, label: "Member Context" },
  { id: "event-details", number: 2, label: "Event Details" },
  { id: "risk-notes", number: 3, label: "Risk & Notes" },
  { id: "submit-queue", number: 4, label: "Submit to Queue" },
] as const;

function ToggleCard({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className={`intake-toggle-card ${checked ? "is-active" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}


export default function NewIntakePage() {
  const router = useRouter();

  const [form, setForm] = useState<IntakeState>(initialState);
  const [activeStep, setActiveStep] = useState<string>("event-details");
  const [saveStatus, setSaveStatus] = useState("Blank intake ready");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        localStorage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft) as Partial<IntakeState>;
          setForm((prev) => ({ ...prev, ...parsed }));
          setSaveStatus("Draft restored");
        }
      } catch {
        setSaveStatus("Using current draft");
      } finally {
        setIsHydrated(true);
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visibleEntries.length > 0) {
          setActiveStep(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-120px 0px -45% 0px",
        threshold: [0.15, 0.3, 0.5, 0.75],
      }
    );

    stepSections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const timeout = window.setTimeout(() => {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
      setSaveStatus("Draft autosaved · just now");
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [form, isHydrated]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (!element) return;

    setActiveStep(sectionId);
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const updateField = <K extends keyof IntakeState>(
    key: K,
    value: IntakeState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const assessment = useMemo(() => {
    const lossAmount = Number(form.potentialLossAmount || 0);
    let score = 0;

    if (form.memberStillOnPhoneWithScammer) score += 3;
    if (form.fundsMayHaveLeft) score += 3;
    if (form.newPayeeOrDestination) score += 2;
    if (form.toldToKeepSecret) score += 2;
    if (form.coachedOrPressured) score += 2;
    if (form.unusualWithdrawalPattern) score += 1;
    if (form.potentiallyVulnerableAdult) score += 1;
    if (lossAmount >= 10000) score += 2;

    let urgency = "Moderate";
    let owner = "Branch + Fraud Ops";
    let nextStep = "Document concern and move to first review.";

    if (score >= 10) {
      urgency = "Critical";
      owner = "Immediate Fraud Ops Review";
      nextStep =
        "Move to first review immediately, verify transaction status, and coordinate live intervention.";
    } else if (score >= 7) {
      urgency = "High";
      owner = "Supervisor + Fraud Ops";
      nextStep =
        "Escalate quickly, confirm member context, and document handoff clearly.";
    }

    return {
      score,
      urgency,
      owner,
      nextStep,
      lossAmount,
    };
  }, [form]);

  const escalationSignals = useMemo(() => {
    const signals = [];

    if (form.memberStillOnPhoneWithScammer) {
      signals.push("Live coaching / scammer still on the line");
    }
    if (form.newPayeeOrDestination) {
      signals.push("New payee or transfer destination");
    }
    if (form.toldToKeepSecret) {
      signals.push("Secrecy instruction / isolation behavior");
    }
    if (form.coachedOrPressured) {
      signals.push("Member appears coached or pressured");
    }
    if (form.unusualWithdrawalPattern) {
      signals.push("Unusual transaction pattern");
    }
    if (form.potentiallyVulnerableAdult) {
      signals.push("Potentially vulnerable adult");
    }
    if (Number(form.potentialLossAmount || 0) >= 10000) {
      signals.push("High-dollar exposure");
    }

    return signals;
  }, [form]);

  const readinessChecks = useMemo(() => {
    return [
      {
        label: "Member identification captured",
        complete: Boolean(form.memberIdentifier && form.memberName),
        sectionId: "member-context",
      },
      {
        label: "Source unit and intake channel selected",
        complete: Boolean(form.sourceUnit && form.intakeChannel),
        sectionId: "event-details",
      },
      {
        label: "Event type and potential loss documented",
        complete: Boolean(form.transactionType && form.potentialLossAmount),
        sectionId: "event-details",
      },
      {
        label: "Narrative observations included",
        complete: Boolean(form.staffObservations.trim()),
        sectionId: "risk-notes",
      },
      {
        label: "Reviewer notes added",
        complete: Boolean(form.operatorNotes.trim()),
        sectionId: "risk-notes",
      },
    ];
  }, [form]);

  const readinessCompleteCount = readinessChecks.filter(
    (item) => item.complete
  ).length;

  const handleSaveDraft = () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
    setSaveStatus("Draft saved");
    window.setTimeout(() => {
      setSaveStatus("Draft autosaved · just now");
    }, 1600);
  };

  const handleLoadSample = () => {
    setForm(sampleState);
    setSaveStatus("Sample intake loaded");
    scrollToSection("member-context");
  };

  const ageBandForApi = (value: string) => {
    if (value === "Under 60") return "under_60";
    if (value === "60-69") return "60_69";
    if (value === "70-79") return "70_79";
    if (value === "80-89" || value === "90+") return "80_plus";
    return "unknown";
  };

  const intakeChannelForApi = (value: string) => {
    if (value === "Branch") return "branch";
    if (value === "Phone") return "phone";
    if (value === "Digital") return "online";
    if (value === "Fraud Referral") return "advisor_report";
    return "other";
  };

  const transactionTypeForApi = (value: string) => {
    if (value === "Wire") return "wire";
    if (value === "Cashier's Check") return "check";
    if (value === "ACH") return "ach";
    if (value === "Cash Withdrawal") return "cash_withdrawal";
    if (value === "Card Activity") return "card";
    return "other";
  };

  const handleSubmitToQueue = async () => {
    const firstIncomplete = readinessChecks.find((item) => !item.complete);
    if (firstIncomplete) {
      setSaveStatus("Complete the missing intake details before submitting");
      scrollToSection(firstIncomplete.sectionId);
      return;
    }
    setIsSubmitting(true);

    const amountAtRisk = Number(form.potentialLossAmount || 0);
    const narrative = [
      form.staffObservations.trim(),
      form.operatorNotes.trim() ? `Operator notes: ${form.operatorNotes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      const createdCase = await createCase({
        customer_identifier: form.memberIdentifier.trim(),
        full_name: form.memberName.trim() || null,
        age_band: ageBandForApi(form.ageBand),
        vulnerable_adult_flag: form.potentiallyVulnerableAdult,
        source_unit: form.sourceUnit,
        trusted_contact_exists: form.trustedContactAvailable,
        trusted_contact_name: form.trustedContactName.trim() || null,
        trusted_contact_phone: form.trustedContactPhone.trim() || null,
        intake_channel: intakeChannelForApi(form.intakeChannel),
        transaction_type: transactionTypeForApi(form.transactionType),
        amount_at_risk: amountAtRisk,
        money_already_left: form.fundsMayHaveLeft,
        customer_currently_on_call_with_scammer: form.memberStillOnPhoneWithScammer,
        new_payee_or_destination: form.newPayeeOrDestination,
        customer_told_to_keep_secret: form.toldToKeepSecret,
        narrative,
        phone_based_imposter_story: form.memberStillOnPhoneWithScammer,
        government_or_bank_brand_impersonation: form.coachedOrPressured,
        fear_or_urgency_language: form.coachedOrPressured,
        secrecy_pressure: form.toldToKeepSecret,
        high_dollar_amount: amountAtRisk >= 10000,
        older_or_vulnerable_customer: form.potentiallyVulnerableAdult,
        repeat_attempt: form.unusualWithdrawalPattern,
        crypto_or_gift_card_request: /crypto|gift/i.test(form.transactionType + " " + narrative),
        remote_access_or_tech_support_story: /remote|tech support|computer|microsoft|apple/i.test(narrative),
      });

      if (form.operatorNotes.trim()) {
        await updateCaseNotes(createdCase.id, form.operatorNotes.trim());
      }

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setSaveStatus("Intake submitted to backend queue");

      window.setTimeout(() => {
        router.push(`/ops?selected=${createdCase.id}`);
      }, 450);
    } catch {
      setSaveStatus("Unable to submit intake right now");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="page-wrap intake-page workspace-shell">
      <section className="intake-progress">
        {stepSections.map((step) => (
          <button
            key={step.id}
            type="button"
            className={`progress-step progress-step-button ${
              activeStep === step.id ? "is-active" : ""
            } ${step.number < 2 ? "is-complete" : ""}`}
            onClick={() => scrollToSection(step.id)}
            aria-current={activeStep === step.id ? "step" : undefined}
          >
            <span className="progress-step-number">{step.number}</span>
            <span className="progress-step-label">{step.label}</span>
          </button>
        ))}
      </section>

      <section className="intake-header console-page-header">
        <div>
          <div className="page-eyebrow">NEW INTAKE</div>
          <h1>New Member Protection Intake</h1>
          <p className="page-subtitle">
            Capture a suspected exploitation concern in a cleaner, structured
            workflow so staff can assess urgency, hand off clearly, and act
            faster.
          </p>
        </div>

        <div className="intake-header-controls">
          <div className="save-status">{saveStatus}</div>
          <div className="page-actions">
            <a href="/ops" className="button button-secondary">
              Back to Queue
            </a>
            <button
              type="button"
              className="button button-secondary"
              onClick={handleLoadSample}
            >
              Load Sample Intake
            </button>
            <button type="button" className="button" onClick={handleSaveDraft}>
              Save Draft
            </button>
          </div>
        </div>
      </section>

      <section className="intake-workspace">
        <div className="intake-main">
          <section
            id="member-context"
            className="intake-card intake-anchor-section"
          >
            <div className="section-head">
              <div>
                <h2>Member Context</h2>
                <p>
                  Identify the member, source unit, and basic vulnerability
                  context.
                </p>
              </div>
              <div className="section-badge">Core details</div>
            </div>

            <div className="intake-form-grid">
              <div className="intake-field span-3">
                <label>Member Identifier</label>
                <input
                  value={form.memberIdentifier}
                  onChange={(e) =>
                    updateField("memberIdentifier", e.target.value)
                  }
                />
              </div>

              <div className="intake-field span-3">
                <label>Member Name</label>
                <input
                  value={form.memberName}
                  onChange={(e) => updateField("memberName", e.target.value)}
                />
              </div>

              <div className="intake-field span-3">
                <label>Age Band</label>
                <select
                  value={form.ageBand}
                  onChange={(e) => updateField("ageBand", e.target.value)}
                >
                  {ageBands.map((band) => (
                    <option key={band}>{band}</option>
                  ))}
                </select>
              </div>

              <div className="intake-field span-3">
                <label>Source Unit</label>
                <select
                  value={form.sourceUnit}
                  onChange={(e) => updateField("sourceUnit", e.target.value)}
                >
                  {sourceUnits.map((unit) => (
                    <option key={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              <div className="intake-field span-6">
                <label>Trusted Contact Name</label>
                <input
                  value={form.trustedContactName}
                  onChange={(e) =>
                    updateField("trustedContactName", e.target.value)
                  }
                />
              </div>

              <div className="intake-field span-6">
                <label>Trusted Contact Phone</label>
                <input
                  value={form.trustedContactPhone}
                  onChange={(e) =>
                    updateField("trustedContactPhone", e.target.value)
                  }
                />
              </div>

              <div className="intake-toggle-grid span-12">
                <ToggleCard
                  label="Potentially vulnerable adult"
                  checked={form.potentiallyVulnerableAdult}
                  onChange={(value) =>
                    updateField("potentiallyVulnerableAdult", value)
                  }
                />
                <ToggleCard
                  label="Trusted contact available"
                  checked={form.trustedContactAvailable}
                  onChange={(value) =>
                    updateField("trustedContactAvailable", value)
                  }
                />
              </div>
            </div>
          </section>

          <section
            id="event-details"
            className="intake-card intake-anchor-section"
          >
            <div className="section-head">
              <div>
                <h2>Suspicious Event Details</h2>
                <p>
                  Capture how the concern entered the workflow and what activity
                  triggered the case.
                </p>
              </div>
              <div className="section-badge">Transaction pattern</div>
            </div>

            <div className="intake-form-grid">
              <div className="intake-field span-4">
                <label>Intake Channel</label>
                <select
                  value={form.intakeChannel}
                  onChange={(e) => updateField("intakeChannel", e.target.value)}
                >
                  {intakeChannels.map((channel) => (
                    <option key={channel}>{channel}</option>
                  ))}
                </select>
              </div>

              <div className="intake-field span-4">
                <label>Transaction Type</label>
                <select
                  value={form.transactionType}
                  onChange={(e) =>
                    updateField("transactionType", e.target.value)
                  }
                >
                  {transactionTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="intake-field span-4">
                <label>Potential Loss Amount</label>
                <input
                  value={form.potentialLossAmount}
                  onChange={(e) =>
                    updateField("potentialLossAmount", e.target.value)
                  }
                />
              </div>

              <div className="intake-toggle-grid span-12">
                <ToggleCard
                  label="Funds may already have left"
                  checked={form.fundsMayHaveLeft}
                  onChange={(value) => updateField("fundsMayHaveLeft", value)}
                />
                <ToggleCard
                  label="Member may still be on the phone with the scammer"
                  checked={form.memberStillOnPhoneWithScammer}
                  onChange={(value) =>
                    updateField("memberStillOnPhoneWithScammer", value)
                  }
                />
                <ToggleCard
                  label="New payee or destination"
                  checked={form.newPayeeOrDestination}
                  onChange={(value) =>
                    updateField("newPayeeOrDestination", value)
                  }
                />
                <ToggleCard
                  label="Member was told to keep it secret"
                  checked={form.toldToKeepSecret}
                  onChange={(value) => updateField("toldToKeepSecret", value)}
                />
              </div>
            </div>
          </section>

          <section
            id="risk-notes"
            className="intake-card intake-anchor-section"
          >
            <div className="section-head">
              <div>
                <h2>Risk Indicators & Notes</h2>
                <p>
                  Document the staff signal behind the escalation and preserve
                  context for the next reviewer.
                </p>
              </div>
              <div className="section-badge">Reviewer context</div>
            </div>

            <div className="intake-form-grid">
              <div className="intake-toggle-grid span-12">
                <ToggleCard
                  label="Member appears coached or pressured"
                  checked={form.coachedOrPressured}
                  onChange={(value) => updateField("coachedOrPressured", value)}
                />
                <ToggleCard
                  label="Unusual withdrawal or transaction pattern"
                  checked={form.unusualWithdrawalPattern}
                  onChange={(value) =>
                    updateField("unusualWithdrawalPattern", value)
                  }
                />
              </div>

              <div className="intake-field span-6">
                <label>Staff Observations</label>
                <textarea
                  value={form.staffObservations}
                  onChange={(e) =>
                    updateField("staffObservations", e.target.value)
                  }
                />
              </div>

              <div className="intake-field span-6">
                <label>Operator Notes</label>
                <textarea
                  value={form.operatorNotes}
                  onChange={(e) =>
                    updateField("operatorNotes", e.target.value)
                  }
                />
              </div>
            </div>
          </section>

          <section
            id="submit-queue"
            className="intake-footer-bar intake-anchor-section"
          >
            <div>
              <h3>Ready for queue submission</h3>
              <p>
                Keep the intake tight, consistent, and clear before handing it
                off for first review.
              </p>
            </div>

            <div className="page-actions">
              <a href="/ops" className="button button-secondary">
                Cancel
              </a>
              <button
                type="button"
                className="button button-secondary"
                onClick={handleLoadSample}
              >
                Load Sample Intake
              </button>
              <button
                type="button"
                className="button button-secondary"
                onClick={handleSaveDraft}
              >
                Save Draft
              </button>
              <button
                type="button"
                className="button"
                onClick={handleSubmitToQueue}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit to Queue"}
              </button>
            </div>
          </section>
        </div>

        <aside className="intake-sidebar inspector-panel">
          <section className="intake-side-card">
            <div className="side-card-top">
              <div>
                <div className="side-card-label">Live assessment</div>
                <h3>Intake triage preview</h3>
              </div>
              <div
                className={`urgency-badge urgency-${assessment.urgency.toLowerCase()}`}
              >
                {assessment.urgency}
              </div>
            </div>

            <div className="intake-summary-list">
              <div className="intake-summary-item">
                <span>Risk score</span>
                <strong>{assessment.score}</strong>
              </div>
              <div className="intake-summary-item">
                <span>Suggested owner</span>
                <strong>{assessment.owner}</strong>
              </div>
              <div className="intake-summary-item">
                <span>Potential loss</span>
                <strong>${assessment.lossAmount.toLocaleString()}</strong>
              </div>
              <div className="intake-summary-item">
                <span>Source unit</span>
                <strong>{form.sourceUnit}</strong>
              </div>
            </div>

            <div className="intake-callout">
              <div className="side-card-label">Recommended next step</div>
              <p>{assessment.nextStep}</p>
            </div>
          </section>

          <section className="intake-side-card">
            <div className="side-card-label">Escalation signals</div>
            <h3>Live flags detected</h3>

            <div className="signal-list">
              {escalationSignals.map((signal) => (
                <div key={signal} className="signal-row">
                  <span className="signal-dot" />
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="intake-side-card">
            <div className="side-card-label">Intake readiness</div>
            <h3>
              {readinessCompleteCount}/{readinessChecks.length} checks complete
            </h3>

            <div className="readiness-list">
              {readinessChecks.map((check) => (
                <div
                  key={check.label}
                  className={`readiness-item ${
                    check.complete ? "is-complete" : ""
                  }`}
                >
                  <span>{check.label}</span>
                  <span className="readiness-state">
                    {check.complete ? "Ready" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="intake-side-card">
            <div className="side-card-label">Workflow destination</div>
            <h3>Where this intake goes next</h3>

            <ul className="workflow-list">
              <li>Capture intake and preserve narrative context</li>
              <li>Move into queue review</li>
              <li>Escalate to supervisor / fraud ops if warranted</li>
              <li>Document next action and ownership</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
