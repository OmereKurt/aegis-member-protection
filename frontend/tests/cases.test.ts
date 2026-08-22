import { afterEach, describe, expect, it, vi } from "vitest";

import { outcomeLabel, toQueueCase, outcomeOptions, type BackendCase } from "../app/lib/cases";

/**
 * toQueueCase is the seam between the API's shape and the operations queue's.
 * Almost all of its behaviour is in the fallbacks: what the UI shows when the
 * backend sends a null, an unrecognised value, or an empty list. Those are the
 * paths a demo never exercises and a real case eventually will.
 */
function backendCase(overrides: Partial<BackendCase> = {}): BackendCase {
  return {
    id: 1,
    case_id: "AEG-1001",
    created_at: new Date().toISOString(),
    status: "New",
    urgency: "High",
    urgency_score: 72,
    scam_type: "Tech support",
    title: "Member asked to buy gift cards",
    summary: "Member reported a caller claiming to be from the bank.",
    customer_identifier: "M-4417",
    full_name: "Dolores Abernathy",
    age_band: "75-84",
    vulnerable_adult_flag: true,
    source_unit: "Branch 14",
    assigned_owner: null,
    assigned_team: null,
    trusted_contact_exists: false,
    intake_channel: "In person",
    transaction_type: "Wire",
    amount_at_risk: 8200,
    money_already_left: false,
    customer_currently_on_call_with_scammer: false,
    new_payee_or_destination: true,
    customer_told_to_keep_secret: true,
    narrative: "Full narrative of the concern.",
    urgency_reasons: ["Secrecy requested"],
    risk_factors: { secrecy: true },
    playbook: {},
    notes: "",
    action_logs: [],
    ...overrides,
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("outcomeLabel", () => {
  it("labels every option the closure form can submit", () => {
    for (const option of outcomeOptions) {
      expect(outcomeLabel(option.value), option.value).toBe(option.label);
    }
  });

  it("reads 'Not recorded' for a case that has not been closed", () => {
    expect(outcomeLabel(null)).toBe("Not recorded");
    expect(outcomeLabel(undefined)).toBe("Not recorded");
    expect(outcomeLabel("")).toBe("Not recorded");
  });

  it("still renders outcomes written by an earlier vocabulary", () => {
    // Cases closed before the outcome list was renamed keep their old values in
    // the database. Reporting counts them, so they have to render as something
    // other than a raw enum.
    expect(outcomeLabel("customer_protected")).toBe("Member protected");
    expect(outcomeLabel("funds_blocked")).toBe("Funds blocked or held");
    expect(outcomeLabel("funds_lost")).toBe("Funds sent / loss occurred");
    expect(outcomeLabel("false_alarm")).toBe("False concern / no exploitation found");
    expect(outcomeLabel("follow_up_required")).toBe("Monitoring only");
    expect(outcomeLabel("unknown")).toBe("Other");
  });

  it("humanises anything it has never seen rather than showing an enum", () => {
    expect(outcomeLabel("some_future_outcome")).toBe("some future outcome");
  });
});

describe("toQueueCase status and risk", () => {
  it("renames In Review to the queue's shorter label", () => {
    expect(toQueueCase(backendCase({ status: "In Review" })).status).toBe("Review");
  });

  it("passes the other statuses through", () => {
    for (const status of ["New", "Escalated", "Closed"] as const) {
      expect(toQueueCase(backendCase({ status })).status).toBe(status);
    }
  });

  it("treats an unrecognised status as New rather than rendering it raw", () => {
    expect(toQueueCase(backendCase({ status: "Pending Triage" })).status).toBe("New");
  });

  it("keeps the four known risk levels", () => {
    for (const urgency of ["Low", "Medium", "High", "Critical"] as const) {
      expect(toQueueCase(backendCase({ urgency })).risk).toBe(urgency);
    }
  });

  it("defaults an unrecognised urgency to Medium", () => {
    // Not to Low: an unreadable urgency on an exploitation case should not
    // sort to the bottom of the queue.
    expect(toQueueCase(backendCase({ urgency: "Severe" })).risk).toBe("Medium");
  });
});

describe("toQueueCase ownership and source", () => {
  it("groups by unit, then by intake channel", () => {
    expect(toQueueCase(backendCase({ source_unit: "Branch 14" })).sourceGroup).toBe(
      "Branch network"
    );
    expect(
      toQueueCase(backendCase({ source_unit: "Team 2", intake_channel: "Inbound call" }))
        .sourceGroup
    ).toBe("Contact center");
    expect(
      toQueueCase(backendCase({ source_unit: "Team 2", intake_channel: "Online banking" }))
        .sourceGroup
    ).toBe("Digital banking");
  });

  it("falls back to Fraud ops when neither matches", () => {
    expect(
      toQueueCase(backendCase({ source_unit: "Unit 9", intake_channel: "Mail" })).sourceGroup
    ).toBe("Fraud ops");
  });

  it("normalises a team name into a queue owner", () => {
    expect(toQueueCase(backendCase({ assigned_team: "Fraud Investigations" })).owner).toBe(
      "Fraud Ops"
    );
    expect(toQueueCase(backendCase({ assigned_team: "Member Protection East" })).owner).toBe(
      "Member Protection"
    );
  });

  it("shows the named owner when there is no recognised team", () => {
    expect(
      toQueueCase(backendCase({ assigned_owner: "R. Okonkwo", assigned_team: null })).owner
    ).toBe("R. Okonkwo");
  });

  it("reads 'Queue' when nobody owns it, so unassigned is visible", () => {
    expect(toQueueCase(backendCase({ assigned_owner: null, assigned_team: null })).owner).toBe(
      "Queue"
    );
  });

  it("prefers the member's name but falls back to their identifier", () => {
    expect(toQueueCase(backendCase({ full_name: "Dolores Abernathy" })).member).toBe(
      "Dolores Abernathy"
    );
    expect(
      toQueueCase(backendCase({ full_name: null, customer_identifier: "M-4417" })).member
    ).toBe("M-4417");
  });
});

describe("toQueueCase age", () => {
  it("describes recent cases in minutes and hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-21T12:00:00Z"));

    expect(toQueueCase(backendCase({ created_at: "2026-04-21T11:30:00Z" })).age).toBe("30 min");
    expect(toQueueCase(backendCase({ created_at: "2026-04-21T09:00:00Z" })).age).toBe("3 hr");
    expect(toQueueCase(backendCase({ created_at: "2026-04-21T12:00:00Z" })).age).toBe("Just now");
  });

  it("does not render a negative age for a clock-skewed future timestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-21T12:00:00Z"));
    expect(toQueueCase(backendCase({ created_at: "2026-04-21T12:05:00Z" })).age).toBe("Just now");
  });

  it("survives a missing or unparseable timestamp", () => {
    expect(toQueueCase(backendCase({ created_at: null })).age).toBe("Today");
    expect(toQueueCase(backendCase({ created_at: "not a date" })).age).toBe("Today");
  });
});

describe("toQueueCase fallbacks for empty fields", () => {
  it("says so when no operator note exists, rather than showing a blank", () => {
    expect(toQueueCase(backendCase({ notes: "" })).note).toBe(
      "No operator note has been recorded yet."
    );
  });

  it("uses the narrative when there is no summary", () => {
    const queue = toQueueCase(backendCase({ summary: "", narrative: "Long form detail." }));
    expect(queue.summary).toBe("Long form detail.");
  });

  it("supplies generic recommended actions when the playbook is empty", () => {
    const queue = toQueueCase(backendCase({ playbook: {} }));
    expect(queue.recommendedActions.length).toBeGreaterThan(0);
  });

  it("prefers the playbook's actions when it has them", () => {
    const queue = toQueueCase(
      backendCase({ playbook: { recommended_actions: ["Place a hold on the wire."] } })
    );
    expect(queue.recommendedActions).toEqual(["Place a hold on the wire."]);
  });

  it("synthesises a timeline entry for a case with no action log", () => {
    // The workspace renders a timeline unconditionally, so an empty list would
    // otherwise leave a blank panel on every freshly created case.
    const queue = toQueueCase(backendCase({ action_logs: [] }));
    expect(queue.timeline).toHaveLength(1);
    expect(queue.timeline[0].title).toBe("Case available in operations");
  });

  it("caps the timeline so a long-running case cannot flood the panel", () => {
    const logs = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      action_type: "status_changed",
      details: `change ${i}`,
      created_at: "2026-04-21T10:00:00Z",
    })) as BackendCase["action_logs"];

    expect(toQueueCase(backendCase({ action_logs: logs })).timeline).toHaveLength(6);
  });

  it("humanises action types it has no title for", () => {
    const logs = [
      { id: 1, action_type: "case_created", details: "Created", created_at: null },
      { id: 2, action_type: "something_new_happened", details: "x", created_at: null },
    ] as unknown as BackendCase["action_logs"];

    const timeline = toQueueCase(backendCase({ action_logs: logs })).timeline;
    expect(timeline[0].title).toBe("Case created");
    expect(timeline[1].title).toBe("something new happened");
    expect(timeline[0].time).toBe("Recent");
  });
});

describe("toQueueCase next step", () => {
  it("reflects the case's stage", () => {
    expect(toQueueCase(backendCase({ status: "Closed" })).nextStep).toBe(
      "Closed with documentation"
    );
    expect(toQueueCase(backendCase({ status: "Escalated" })).nextStep).toBe(
      "Supervisor and fraud review underway"
    );
    expect(toQueueCase(backendCase({ status: "In Review" })).nextStep).toContain(
      "documented follow-up"
    );
  });

  it("takes the escalation path first for a new case", () => {
    const queue = toQueueCase(
      backendCase({
        status: "New",
        playbook: {
          recommended_escalation_path: ["Escalate to fraud ops immediately."],
          recommended_actions: ["Ask about the caller."],
        },
      })
    );
    expect(queue.nextStep).toBe("Escalate to fraud ops immediately.");
  });

  it("falls back to a recommended action, then to generic guidance", () => {
    expect(
      toQueueCase(backendCase({ status: "New", playbook: { recommended_actions: ["Ask why."] } }))
        .nextStep
    ).toBe("Ask why.");
    expect(toQueueCase(backendCase({ status: "New", playbook: {} })).nextStep).toBe(
      "Document concern and move to first review."
    );
  });
});

describe("toQueueCase closure", () => {
  it("carries the closure record through with a rendered label", () => {
    const queue = toQueueCase(
      backendCase({
        status: "Closed",
        outcome_type: "member_protected",
        estimated_amount_protected: 8200,
        trusted_contact_engaged: true,
        closed_at: "2026-04-21T15:00:00Z",
      })
    );

    expect(queue.closure?.outcomeType).toBe("member_protected");
    expect(queue.closure?.outcomeLabel).toBe("Member protected");
    expect(queue.closure?.estimatedAmountProtected).toBe(8200);
    expect(queue.closure?.trustedContactEngaged).toBe(true);
  });

  it("reports an open case as having no recorded outcome", () => {
    expect(toQueueCase(backendCase({ outcome_type: null })).closure?.outcomeLabel).toBe(
      "Not recorded"
    );
  });

  it("prefers the closure summary over the older notes field", () => {
    const queue = toQueueCase(
      backendCase({ closure_summary: "Wire stopped.", closure_notes: "old note" })
    );
    expect(queue.closure?.closureSummary).toBe("Wire stopped.");
  });
});

describe("toQueueCase identity", () => {
  it("keeps both the string id the UI keys on and the numeric backend id", () => {
    const queue = toQueueCase(backendCase({ id: 42, case_id: "AEG-1042" }));
    expect(queue.id).toBe("42");
    expect(queue.backendId).toBe(42);
    expect(queue.caseNumber).toBe("AEG-1042");
  });
});
