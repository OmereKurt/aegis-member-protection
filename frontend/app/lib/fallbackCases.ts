import type { QueueCase } from "./cases";

export const fallbackCases: QueueCase[] = [
  {
    id: "AGE-2418",
    title: "Member requesting repeated cashier’s checks for new online contact",
    source: "Downtown branch",
    sourceGroup: "Branch network",
    member: "Evelyn R.",
    risk: "High",
    status: "Escalated",
    owner: "Fraud Ops",
    age: "42 min",
    nextStep: "Supervisor callback + transaction hold review",
    summary:
      "Branch staff reported repeated cashier’s check requests tied to a newly introduced online contact. The member appeared uncertain about transaction purpose and deferred to outside instruction.",
    note:
      "Coaching behavior, urgency, and transaction persistence suggest a higher-likelihood exploitation pattern requiring supervisor and fraud coordination.",
    recommendedActions: [
      "Confirm member intent without third-party influence.",
      "Review recent transaction attempts and linked channels.",
      "Escalate to supervisor and fraud operations.",
      "Document staff observations and preserve timeline details.",
    ],
    timeline: [
      {
        title: "Case escalated from branch to fraud operations",
        time: "2:18 PM",
        body: "Branch staff documented coaching behavior by accompanying individual and requested elevated review.",
      },
      {
        title: "Member outreach queued",
        time: "2:07 PM",
        body: "Outbound verification requested before release of additional transaction activity.",
      },
      {
        title: "Urgency score updated to high",
        time: "1:56 PM",
        body: "Narrative and transaction pattern triggered elevated handling threshold.",
      },
      {
        title: "Transaction hold review requested",
        time: "1:41 PM",
        body: "Team requested verification before additional cashier’s check activity proceeds.",
      },
    ],
  },
  {
    id: "AGE-2417",
    title: "Wire transfer pressure after repeated grandchild emergency calls",
    source: "Contact center",
    sourceGroup: "Contact center",
    member: "Harold T.",
    risk: "Critical",
    status: "Review",
    owner: "Member Protection",
    age: "19 min",
    nextStep: "Outbound verification and case note completion",
    summary:
      "Member described repeated emergency calls requesting urgent wire transfers for a supposed family crisis. Contact center staff identified pressure tactics and inconsistent story details.",
    note:
      "The emotional urgency and repeated contact pattern suggest elevated scam risk and require rapid documented follow-up.",
    recommendedActions: [
      "Pause wire activity pending direct verification.",
      "Call back using existing member contact details.",
      "Document pressure language and stated beneficiary details.",
      "Coordinate with fraud or supervisor review if urgency persists.",
    ],
    timeline: [
      {
        title: "Case routed for member protection review",
        time: "2:26 PM",
        body: "Contact center team elevated after repeated emergency-transfer language.",
      },
      {
        title: "Outbound verification requested",
        time: "2:13 PM",
        body: "Agent recommended callback using known contact details before any release.",
      },
      {
        title: "Case opened from contact center interaction",
        time: "1:58 PM",
        body: "Initial case created after member referenced urgent wire instructions tied to family distress.",
      },
    ],
  },
  {
    id: "AGE-2415",
    title: "Companion attempting to direct withdrawal and override member responses",
    source: "North branch",
    sourceGroup: "Branch network",
    member: "Miriam S.",
    risk: "High",
    status: "New",
    owner: "Queue",
    age: "1 hr",
    nextStep: "Branch manager review",
    summary:
      "Branch staff observed a companion answering questions for the member and attempting to direct a large withdrawal. The member appeared hesitant and deferred repeatedly.",
    note:
      "Observed third-party control behavior indicates a possible exploitation pattern and should be documented before funds leave the account.",
    recommendedActions: [
      "Separate member from companion if possible during questioning.",
      "Document exact staff observations in the case record.",
      "Escalate for branch manager or fraud review.",
      "Assess whether additional transactions should be delayed.",
    ],
    timeline: [
      {
        title: "Case created by branch staff",
        time: "1:44 PM",
        body: "Staff escalated concern after repeated third-party interference during withdrawal discussion.",
      },
      {
        title: "Manager review requested",
        time: "1:37 PM",
        body: "Branch team flagged the case for supervisory support.",
      },
    ],
  },
  {
    id: "AGE-2412",
    title: "Unusual ACH activity following recent device and contact detail changes",
    source: "Digital banking",
    sourceGroup: "Digital banking",
    member: "James W.",
    risk: "Medium",
    status: "Review",
    owner: "Fraud Ops",
    age: "2 hrs",
    nextStep: "Confirm recent profile changes with member",
    summary:
      "Recent profile updates were followed by unusual ACH activity. The pattern is not conclusive on its own, but the change sequence warrants a structured review.",
    note:
      "This case may reflect account takeover or coached activity and should stay in monitored review until member verification is complete.",
    recommendedActions: [
      "Confirm recent device and contact changes with the member.",
      "Review timing of ACH initiation against profile modifications.",
      "Document any recent outreach or self-service anomalies.",
      "Escalate if verification fails or member expresses uncertainty.",
    ],
    timeline: [
      {
        title: "Fraud operations opened structured review",
        time: "12:56 PM",
        body: "Device and contact detail changes preceded unusual ACH behavior.",
      },
      {
        title: "ACH activity linked to profile changes",
        time: "12:31 PM",
        body: "System review flagged timing overlap between updates and transaction activity.",
      },
    ],
  },
  {
    id: "AGE-2408",
    title: "Teller concern after repeated high-value withdrawals with inconsistent purpose",
    source: "West branch",
    sourceGroup: "Branch network",
    member: "Sharon K.",
    risk: "High",
    status: "Closed",
    owner: "Branch Ops",
    age: "Today",
    nextStep: "Closed with documentation",
    summary:
      "A teller documented repeated high-value withdrawals over multiple visits. Follow-up conversations led to a closed case with completed notes and outcome tracking.",
    note:
      "The case is closed, but it remains useful as an example of documented intervention and branch-originated visibility.",
    recommendedActions: [
      "Retain completed documentation and timeline history.",
      "Review whether branch coaching or awareness follow-up is needed.",
      "Use as a reference pattern for similar future cases.",
    ],
    timeline: [
      {
        title: "Case closed with final documentation",
        time: "11:42 AM",
        body: "Branch team completed notes and closure summary after follow-up review.",
      },
      {
        title: "Final member verification completed",
        time: "10:55 AM",
        body: "Staff documented the final conversation and outcome before closure.",
      },
    ],
  },
];
