import { apiUrl, fetchJson } from "./api";

export type AssistType = "case_summary" | "operator_note" | "playbook_explanation" | "management_brief";

export type AssistResponse = {
  assist_type: AssistType;
  draft: string;
  disclaimer: string;
  source_fields: string[];
  provider: string;
};

type AssistRequest = {
  case_id: number;
  recommended_step?: string;
};

function postAssist(path: string, payload: AssistRequest) {
  return fetchJson<AssistResponse>(apiUrl(path), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function generateCaseSummaryDraft(caseId: number) {
  return postAssist("/api/assist/case-summary", { case_id: caseId });
}

export function generateOperatorNoteDraft(caseId: number) {
  return postAssist("/api/assist/operator-note", { case_id: caseId });
}

export function generatePlaybookExplanation(caseId: number, recommendedStep?: string) {
  return postAssist("/api/assist/playbook-explanation", {
    case_id: caseId,
    recommended_step: recommendedStep,
  });
}

export function generateManagementBriefDraft() {
  return fetchJson<AssistResponse>(apiUrl("/api/assist/management-brief"), {
    method: "POST",
    body: JSON.stringify({}),
  });
}
