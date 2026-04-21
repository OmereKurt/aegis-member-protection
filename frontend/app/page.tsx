"use client";

import { useState } from "react";

export default function HomePage() {
  const [formData, setFormData] = useState({
    alert_id: "alert-001",
    source: "manual",
    timestamp: "2026-04-21T15:00:00Z",
    title: "Suspicious Login",
    user_email: "user@company.com",
    ip: "203.0.113.10",
    country: "Netherlands",
    city: "Amsterdam",
    failed_logins_before_success: 7,
    impossible_travel: true,
    new_geo: true,
    mfa_enabled: true,
    vpn_or_hosting_asn: true,
    privileged_user: false,
  });

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "failed_logins_before_success"
          ? Number(value)
          : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/api/alerts/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze alert");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  }

  return (
    <main style={{ maxWidth: "900px", margin: "40px auto", fontFamily: "Arial, sans-serif", padding: "0 16px" }}>
      <h1>Analyst Copilot</h1>
      <p>Submit a suspicious login alert for analysis.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px", marginBottom: "32px" }}>
        <input name="alert_id" placeholder="Alert ID" value={formData.alert_id} onChange={handleChange} />
        <input name="source" placeholder="Source" value={formData.source} onChange={handleChange} />
        <input name="timestamp" placeholder="Timestamp" value={formData.timestamp} onChange={handleChange} />
        <input name="title" placeholder="Title" value={formData.title} onChange={handleChange} />
        <input name="user_email" placeholder="User Email" value={formData.user_email} onChange={handleChange} />
        <input name="ip" placeholder="IP Address" value={formData.ip} onChange={handleChange} />
        <input name="country" placeholder="Country" value={formData.country} onChange={handleChange} />
        <input name="city" placeholder="City" value={formData.city} onChange={handleChange} />
        <input
          name="failed_logins_before_success"
          type="number"
          placeholder="Failed logins before success"
          value={formData.failed_logins_before_success}
          onChange={handleChange}
        />

        <label>
          <input
            type="checkbox"
            name="impossible_travel"
            checked={formData.impossible_travel}
            onChange={handleChange}
          />
          Impossible travel
        </label>

        <label>
          <input
            type="checkbox"
            name="new_geo"
            checked={formData.new_geo}
            onChange={handleChange}
          />
          New geography
        </label>

        <label>
          <input
            type="checkbox"
            name="mfa_enabled"
            checked={formData.mfa_enabled}
            onChange={handleChange}
          />
          MFA enabled
        </label>

        <label>
          <input
            type="checkbox"
            name="vpn_or_hosting_asn"
            checked={formData.vpn_or_hosting_asn}
            onChange={handleChange}
          />
          VPN or hosting ASN
        </label>

        <label>
          <input
            type="checkbox"
            name="privileged_user"
            checked={formData.privileged_user}
            onChange={handleChange}
          />
          Privileged user
        </label>

        <button type="submit">Analyze Alert</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div style={{ border: "1px solid #ccc", padding: "16px", borderRadius: "8px" }}>
          <h2>Analysis Result</h2>
          <p><strong>Severity:</strong> {result.severity}</p>
          <p><strong>Score:</strong> {result.score}</p>
          <p><strong>Summary:</strong> {result.summary}</p>

          <h3>Reasons</h3>
          <ul>
            {result.reasons.map((reason: string, index: number) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>

          <h3>Recommended Actions</h3>
          <ul>
            {result.recommended_actions.map((action: string, index: number) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: "24px" }}>
        <a href="/cases">View Saved Cases</a>
      </div>
    </main>
  );
}
