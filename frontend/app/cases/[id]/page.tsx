"use client";

import { useEffect, useState } from "react";

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [caseData, setCaseData] = useState<any>(null);
  const [error, setError] = useState("");
  const [caseId, setCaseId] = useState<string>("");

  useEffect(() => {
    async function loadParamsAndFetchCase() {
      const resolvedParams = await params;
      setCaseId(resolvedParams.id);

      try {
        const response = await fetch(`http://localhost:8000/api/cases/${resolvedParams.id}`);

        if (!response.ok) {
          throw new Error("Failed to load case");
        }

        const data = await response.json();
        setCaseData(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      }
    }

    loadParamsAndFetchCase();
  }, [params]);

  return (
    <main style={{ maxWidth: "900px", margin: "40px auto", fontFamily: "Arial, sans-serif", padding: "0 16px" }}>
      <h1>Case Details</h1>
      <a href="/cases">Back to Cases</a>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {!caseData && !error && <p>Loading case {caseId ? `#${caseId}` : ""}...</p>}

      {caseData && (
        <div style={{ marginTop: "24px" }}>
          <p><strong>ID:</strong> {caseData.id}</p>
          <p><strong>Alert ID:</strong> {caseData.alert_id}</p>
          <p><strong>Title:</strong> {caseData.title}</p>
          <p><strong>Severity:</strong> {caseData.severity}</p>
          <p><strong>Score:</strong> {caseData.score}</p>
          <p><strong>Summary:</strong> {caseData.summary}</p>

          <h3>Recommended Actions</h3>
          <ul>
            {caseData.recommended_actions.map((action: string, index: number) => (
              <li key={index}>{action}</li>
            ))}
          </ul>

          <h3>Normalized Alert</h3>
          <pre style={{ background: "#f4f4f4", padding: "12px", overflowX: "auto" }}>
            {JSON.stringify(caseData.normalized_alert, null, 2)}
          </pre>

          <h3>Enrichment</h3>
          <pre style={{ background: "#f4f4f4", padding: "12px", overflowX: "auto" }}>
            {JSON.stringify(caseData.enrichment, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
