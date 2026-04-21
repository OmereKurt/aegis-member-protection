"use client";

import { useEffect, useState } from "react";

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
    <main style={{ maxWidth: "900px", margin: "40px auto", fontFamily: "Arial, sans-serif", padding: "0 16px" }}>
      <h1>Saved Cases</h1>
      <a href="/">Back to Submit Alert</a>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginTop: "24px", display: "grid", gap: "16px" }}>
        {cases.map((caseItem) => (
          <div
            key={caseItem.id}
            style={{ border: "1px solid #ccc", padding: "16px", borderRadius: "8px" }}
          >
            <h2>{caseItem.title}</h2>
            <p><strong>ID:</strong> {caseItem.id}</p>
            <p><strong>Severity:</strong> {caseItem.severity}</p>
            <p><strong>Score:</strong> {caseItem.score}</p>
            <p><strong>Summary:</strong> {caseItem.summary}</p>
            <a href={`/cases/${caseItem.id}`}>View Case Details</a>
          </div>
        ))}
      </div>
    </main>
  );
}
