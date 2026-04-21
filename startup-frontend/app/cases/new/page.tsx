"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const defaultForm = {
  customer_identifier: "CU-00421",
  full_name: "Evelyn Carter",
  age_band: "70_79",
  vulnerable_adult_flag: true,

  trusted_contact_exists: true,
  trusted_contact_name: "Michael Carter",
  trusted_contact_phone: "555-222-1188",

  intake_channel: "branch",
  transaction_type: "wire",
  amount_at_risk: 18500,

  money_already_left: false,
  customer_currently_on_call_with_scammer: true,
  new_payee_or_destination: true,
  customer_told_to_keep_secret: true,

  narrative:
    "Customer stated a caller claiming to be from the bank fraud department instructed an urgent wire transfer to protect retirement funds.",

  phone_based_imposter_story: true,
  government_or_bank_brand_impersonation: true,
  fear_or_urgency_language: true,
  secrecy_pressure: true,
  high_dollar_amount: true,
  older_or_vulnerable_customer: true,
  repeat_attempt: false,
  remote_access_or_tech_support_story: false,
  crypto_or_gift_card_request: false,
  romance_or_emotional_dependency_pattern: false,
};

export default function NewCasePage() {
  const router = useRouter();
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "amount_at_risk"
          ? Number(value)
          : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/scam-cases/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to create case");
      }

      const data = await response.json();
      router.push(`/cases/${data.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  }

  return (
    <main>
      <div className="page-header">
        <h1>New Case Intake</h1>
        <p className="page-subtitle">
          Capture the suspicious event, classify the likely scam pattern, and generate the initial intervention workflow.
        </p>

        <div className="nav-row">
          <a href="/">Back to Queue</a>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid">
        <div className="card">
          <h2>Customer Context</h2>
          <div className="form-grid-2" style={{ marginTop: "16px" }}>
            <div className="field-group">
              <label>Customer Identifier</label>
              <input name="customer_identifier" value={form.customer_identifier} onChange={handleChange} />
            </div>

            <div className="field-group">
              <label>Full Name</label>
              <input name="full_name" value={form.full_name} onChange={handleChange} />
            </div>

            <div className="field-group">
              <label>Age Band</label>
              <select name="age_band" value={form.age_band} onChange={handleChange}>
                <option value="under_60">Under 60</option>
                <option value="60_69">60-69</option>
                <option value="70_79">70-79</option>
                <option value="80_plus">80+</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="vulnerable_adult_flag"
                checked={form.vulnerable_adult_flag}
                onChange={handleChange}
              />
              Vulnerable adult flag
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="trusted_contact_exists"
                checked={form.trusted_contact_exists}
                onChange={handleChange}
              />
              Trusted contact exists
            </label>

            <div className="field-group">
              <label>Trusted Contact Name</label>
              <input name="trusted_contact_name" value={form.trusted_contact_name} onChange={handleChange} />
            </div>

            <div className="field-group">
              <label>Trusted Contact Phone</label>
              <input name="trusted_contact_phone" value={form.trusted_contact_phone} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="card">
          <h2>Event Details</h2>
          <div className="form-grid-2" style={{ marginTop: "16px" }}>
            <div className="field-group">
              <label>Intake Channel</label>
              <select name="intake_channel" value={form.intake_channel} onChange={handleChange}>
                <option value="branch">Branch</option>
                <option value="phone">Phone</option>
                <option value="family_report">Family Report</option>
                <option value="advisor_report">Advisor Report</option>
                <option value="online">Online</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="field-group">
              <label>Transaction Type</label>
              <select name="transaction_type" value={form.transaction_type} onChange={handleChange}>
                <option value="wire">Wire</option>
                <option value="ach">ACH</option>
                <option value="cash_withdrawal">Cash Withdrawal</option>
                <option value="check">Check</option>
                <option value="card">Card</option>
                <option value="crypto">Crypto</option>
                <option value="gift_cards">Gift Cards</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="field-group">
              <label>Amount at Risk</label>
              <input
                type="number"
                name="amount_at_risk"
                value={form.amount_at_risk}
                onChange={handleChange}
              />
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="money_already_left"
                checked={form.money_already_left}
                onChange={handleChange}
              />
              Money already left
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="customer_currently_on_call_with_scammer"
                checked={form.customer_currently_on_call_with_scammer}
                onChange={handleChange}
              />
              Customer currently on call with scammer
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="new_payee_or_destination"
                checked={form.new_payee_or_destination}
                onChange={handleChange}
              />
              New payee or destination
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="customer_told_to_keep_secret"
                checked={form.customer_told_to_keep_secret}
                onChange={handleChange}
              />
              Customer told to keep it secret
            </label>
          </div>

          <div className="field-group" style={{ marginTop: "16px" }}>
            <label>Narrative</label>
            <textarea name="narrative" value={form.narrative} onChange={handleChange} />
          </div>
        </div>

        <div className="card">
          <h2>Risk Factors</h2>
          <div className="form-grid-2" style={{ marginTop: "16px" }}>
            <label className="checkbox-row">
              <input type="checkbox" name="phone_based_imposter_story" checked={form.phone_based_imposter_story} onChange={handleChange} />
              Phone-based imposter story
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="government_or_bank_brand_impersonation" checked={form.government_or_bank_brand_impersonation} onChange={handleChange} />
              Government or bank brand impersonation
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="fear_or_urgency_language" checked={form.fear_or_urgency_language} onChange={handleChange} />
              Fear or urgency language
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="secrecy_pressure" checked={form.secrecy_pressure} onChange={handleChange} />
              Secrecy pressure
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="high_dollar_amount" checked={form.high_dollar_amount} onChange={handleChange} />
              High-dollar amount
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="older_or_vulnerable_customer" checked={form.older_or_vulnerable_customer} onChange={handleChange} />
              Older or vulnerable customer
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="repeat_attempt" checked={form.repeat_attempt} onChange={handleChange} />
              Repeat attempt
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="remote_access_or_tech_support_story" checked={form.remote_access_or_tech_support_story} onChange={handleChange} />
              Remote access / tech support story
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="crypto_or_gift_card_request" checked={form.crypto_or_gift_card_request} onChange={handleChange} />
              Crypto or gift card request
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="romance_or_emotional_dependency_pattern" checked={form.romance_or_emotional_dependency_pattern} onChange={handleChange} />
              Romance / emotional dependency pattern
            </label>
          </div>
        </div>

        <div className="button-row">
          <button className="button" type="submit">Create Case</button>
          <a href="/">Cancel</a>
        </div>

        {error && <p className="error">{error}</p>}
      </form>
    </main>
  );
}
