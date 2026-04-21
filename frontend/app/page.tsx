"use client";

import { useEffect, useMemo, useState } from "react";

function getSeverityClass(severity: string) {
  const value = severity.toLowerCase();
  if (value === "low") return "badge badge-low";
  if (value === "medium") return "badge badge-medium";
  if (value === "high") return "badge badge-high";
  return "badge badge-critical";
}

export default function HomePage() {
  const [alertType, setAlertType] = useState("suspicious_login");

  const [loginForm, setLoginForm] = useState({
    alert_id: "alert-101",
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

  const [phishingForm, setPhishingForm] = useState({
    alert_id: "alert-201",
    source: "manual",
    timestamp: "2026-04-21T16:00:00Z",
    title: "Phishing Email",
    recipient_email: "employee@company.com",
    sender_email: "it-support@secure-helpdesk.com",
    sender_domain: "secure-helpdesk.com",
    subject: "Password Reset Required",
    display_name_mismatch: true,
    url_present: true,
    attachment_present: false,
    newly_registered_domain: true,
    multiple_recipients: true,
  });

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [cases, setCases] = useState<any[]>([]);
  const [casesError, setCasesError] = useState("");

  async function loadCases() {
    try {
      const response = await fetch("http://localhost:8000/api/cases");

      if (!response.ok) {
        throw new Error("Failed to load dashboard cases");
      }

      const data = await response.json();
      setCases(data);
      setCasesError("");
    } catch (err: any) {
      setCasesError(err.message || "Could not load dashboard");
    }
  }

  useEffect(() => {
    loadCases();
  }, []);

  const severityCounts = useMemo(() => {
    const counts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const caseItem of cases) {
      const severity = String(caseItem.severity || "").toLowerCase();

      if (severity === "low") counts.low += 1;
      else if (severity === "medium") counts.medium += 1;
      else if (severity === "high") counts.high += 1;
      else if (severity === "critical") counts.critical += 1;
    }

    return counts;
  }, [cases]);

  const latestCases = useMemo(() => {
    return [...cases].slice(-5).reverse();
  }, [cases]);

  function handleLoginChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "failed_logins_before_success"
          ? Number(value)
          : value,
    }));
  }

  function handlePhishingChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setPhishingForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    const payload =
      alertType === "suspicious_login"
        ? {
            alert_type: "suspicious_login",
            suspicious_login: loginForm,
          }
        : {
            alert_type: "phishing_email",
            phishing_email: phishingForm,
          };

    try {
      const response = await fetch("http://localhost:8000/api/alerts/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze alert");
      }

      const data = await response.json();
      setResult(data);
      await loadCases();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  }

  return (
    <main>
      <h1>Analyst Copilot</h1>
      <p className="muted">
        Submit a security alert and turn it into a triage-ready case.
      </p>

      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          marginBottom: "24px",
        }}
      >
        <div className="card">
          <p className="muted">Total Cases</p>
          <h2>{cases.length}</h2>
        </div>
        <div className="card">
          <p className="muted">Low</p>
          <h2><span className="badge badge-low">{severityCounts.low}</span></h2>
        </div>
        <div className="card">
          <p className="muted">Medium</p>
          <h2><span className="badge badge-medium">{severityCounts.medium}</span></h2>
        </div>
        <div className="card">
          <p className="muted">High</p>
          <h2><span className="badge badge-high">{severityCounts.high}</span></h2>
        </div>
        <div className="card">
          <p className="muted">Critical</p>
          <h2><span className="badge badge-critical">{severityCounts.critical}</span></h2>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "24px" }}>
        <h2>Latest Cases</h2>
        {casesError && <p className="error">{casesError}</p>}
        {!casesError && latestCases.length === 0 && <p className="muted">No cases yet.</p>}

        <div className="case-list">
          {latestCases.map((caseItem) => (
            <div key={caseItem.id} style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
              <p><strong>{caseItem.title}</strong></p>
              <p className="muted">Case #{caseItem.id}</p>
              <p>
                <span className={getSeverityClass(caseItem.severity)}>{caseItem.severity}</span>
              </p>
              <a href={`/cases/${caseItem.id}`}>Open Case</a>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="form-grid" style={{ marginBottom: "16px" }}>
          <label>
            <strong>Alert Type</strong>
          </label>
          <select
            value={alertType}
            onChange={(e) => setAlertType(e.target.value)}
            style={{ padding: "12px 14px", borderRadius: "10px", border: "1px solid #d1d5db" }}
          >
            <option value="suspicious_login">Suspicious Login</option>
            <option value="phishing_email">Phishing Email</option>
          </select>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
          {alertType === "suspicious_login" && (
            <>
              <input name="alert_id" placeholder="Alert ID" value={loginForm.alert_id} onChange={handleLoginChange} />
              <input name="source" placeholder="Source" value={loginForm.source} onChange={handleLoginChange} />
              <input name="timestamp" placeholder="Timestamp" value={loginForm.timestamp} onChange={handleLoginChange} />
              <input name="title" placeholder="Title" value={loginForm.title} onChange={handleLoginChange} />
              <input name="user_email" placeholder="User Email" value={loginForm.user_email} onChange={handleLoginChange} />
              <input name="ip" placeholder="IP Address" value={loginForm.ip} onChange={handleLoginChange} />
              <input name="country" placeholder="Country" value={loginForm.country} onChange={handleLoginChange} />
              <input name="city" placeholder="City" value={loginForm.city} onChange={handleLoginChange} />
              <input
                name="failed_logins_before_success"
                type="number"
                placeholder="Failed logins before success"
                value={loginForm.failed_logins_before_success}
                onChange={handleLoginChange}
              />

              <label className="checkbox-row">
                <input type="checkbox" name="impossible_travel" checked={loginForm.impossible_travel} onChange={handleLoginChange} />
                Impossible travel
              </label>

              <label className="checkbox-row">
                <input type="checkbox" name="new_geo" checked={loginForm.new_geo} onChange={handleLoginChange} />
                New geography
              </label>

              <label className="checkbox-row">
                <input type="checkbox" name="mfa_enabled" checked={loginForm.mfa_enabled} onChange={handleLoginChange} />
                MFA enabled
              </label>

              <label className="checkbox-row">
                <input type="checkbox" name="vpn_or_hosting_asn" checked={loginForm.vpn_or_hosting_asn} onChange={handleLoginChange} />
                VPN or hosting ASN
              </label>

              <label className="checkbox-row">
                <input type="checkbox" name="privileged_user" checked={loginForm.privileged_user} onChange={handleLoginChange} />
                Privileged user
              </label>
            </>
          )}

          {alertType === "phishing_email" && (
            <>
              <input name="alert_id" placeholder="Alert ID" value={phishingForm.alert_id} onChange={handlePhishingChange} />
              <input name="source" placeholder="Source" value={phishingForm.source} onChange={handlePhishingChange} />
              <input name="timestamp" placeholder="Timestamp" value={phishingForm.timestamp} onChange={handlePhishingChange} />
              <input name="title" placeholder="Title" value={phishingForm.title} onChange={handlePhishingChange} />
              <input name="recipient_email" placeholder="Recipient Email" value={phishingForm.recipient_email} onChange={handlePhishingChange} />
              <input name="sender_email" placeholder="Sender Email" value={phishingForm.sender_email} onChange={handlePhishingChange} />
              <input name="sender_domain" placeholder="Sender Domain" value={phishingForm.sender_domain} onChange={handlePhishingChange} />
              <input name="subject" placeholder="Subject" value={phishingForm.subject} onChange={handlePhishingChange} />

              <label className="checkbox-row">
                <input type="checkbox" name="display_name_mismatch" checked={phishingForm.display_name_mismatch} onChange={handlePhishingChange} />
                Display name mismatch
              </label>

              <label className="checkbox-row">
                <input type="checkbox" name="url_present" checked={phishingForm.url_present} onChange={handlePhishingChange} />
                URL present
              </label>

              <label className="checkbox-row">
                <input type="checkbox" name="attachment_present" checked={phishingForm.attachment_present} onChange={handlePhishingChange} />
                Attachment present
              </label>

              <label className="checkbox-row">
                <input type="checkbox" name="newly_registered_domain" checked={phishingForm.newly_registered_domain} onChange={handlePhishingChange} />
                Newly registered domain
              </label>

              <label className="checkbox-row">
                <input type="checkbox" name="multiple_recipients" checked={phishingForm.multiple_recipients} onChange={handlePhishingChange} />
                Multiple recipients
              </label>
            </>
          )}

          <button className="button" type="submit">Analyze Alert</button>
        </form>

        <div className="link-row">
          <a href="/cases">View Saved Cases</a>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="card" style={{ marginTop: "24px" }}>
          <h2>Analysis Result</h2>
          <p>
            <strong>Severity:</strong>{" "}
            <span className={getSeverityClass(result.severity)}>{result.severity}</span>
          </p>
          <p><strong>Score:</strong> {result.score}</p>
          <p><strong>Summary:</strong> {result.summary}</p>

          <h3 className="section-title">Reasons</h3>
          <ul>
            {result.reasons.map((reason: string, index: number) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>

          <h3 className="section-title">Recommended Actions</h3>
          <ul>
            {result.recommended_actions.map((action: string, index: number) => (
              <li key={index}>{action}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
