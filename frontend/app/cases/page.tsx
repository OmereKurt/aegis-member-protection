"use client";

import { useEffect, useState } from "react";

function getSeverityClass(severity: string) {
  const value = severity.toLowerCase();
  if (value === "low") return "badge badge-low";
  if (value === "medium") return "badge badge-medium";
  if (value === "high") return "badge badge-high";
  return "badge badge-critical";
}

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCases() {
      try {
        const response = await fetch("http://localhost:8000/api/cases");

        if (!response.ok) {
          throw new Error("Failed to load cases");
        }

        const data = await response.json();
        setCases(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      }
    }

    fetchCases();
  }, []);

  return (
    <main>
      <h1>Saved Cases</h1>
      <p className="muted">Previously analyzed alerts stored by the backend.</p>
      <div className="link-row">
        <a href="/">Back to Submit Alert</a>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="case-list">
        {cases.map((caseItem) => (
          <div key={caseItem.id} className="card">
            <h2>{caseItem.title}</h2>
            <p><strong>ID:</strong> {caseItem.id}</p>
            <p>
              <strong>Severity:</strong>{" "}
              <span className={getSeverityClass(caseItem.severity)}>{caseItem.severity}</span>
            </p>
            <p><strong>Score:</strong> {caseItem.score}</p>
            <p><strong>Summary:</strong> {caseItem.summary}</p>
            <div className="link-row">
              <a href={`/cases/${caseItem.id}`}>View Case Details</a>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
