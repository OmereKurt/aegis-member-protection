"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const defaultForm = {
  customer_identifier: "CU-00421",
  full_name: "Evelyn Carter",
  age_band: "70_79",
  vulnerable_adult_flag: true,

  source_unit: "Downtown Branch",

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
    "Member stated a caller claiming to be from the bank fraud department instructed an urgent wire transfer to protect retirement funds.",

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
      const response = await fetch("/backend/api/scam-cases/intake", {
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
        <h1>New Member Protection Intake</h1>
        <p className="page-subtitle">
          Capture a suspected elder financial exploitation event quickly so staff can assess urgency and intervene before funds move.
        </p>

        <div className="nav-row">
          <a href="/ops">Back to Queue</a>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid">
        <div className="card">
          <h2>Member Context</h2>
          <div className="form-grid-2" style={{ marginTop: "16px" }}>
            <div className="field-group">
              <label>Member Identifier</label>
              <input name="customer_identifier" value={form.customer_identifier} onChange={handleChange} />
            </div>

            <div className="field-group">
              <label>Member Name</label>
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

            <div className="field-group">
              <label>Source Unit</label>
              <input
                name="source_unit"
                value={form.source_unit}
                onChange={handleChange}
                placeholder="Downtown Branch, Contact Center, Fraud Ops"
              />
            </div>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="vulnerable_adult_flag"
                checked={form.vulnerable_adult_flag}
                onChange={handleChange}
              />
              Potentially vulnerable adult
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="trusted_contact_exists"
                checked={form.trusted_contact_exists}
                onChange={handleChange}
              />
              Trusted contact available
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
          <h2>Suspicious Event Details</h2>
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
              <label>Potential Loss Amount</label>
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
              Funds may already have left
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="customer_currently_on_call_with_scammer"
                checked={form.customer_currently_on_call_with_scammer}
                onChange={handleChange}
              />
              Member may still be on the phone with the scammer
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="new_payee_or_destination"
                checked={form.new_payee_or_destination}
                onChange={handleChange}
              />
              New payee or destination involved
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                name="customer_told_to_keep_secret"
                checked={form.customer_told_to_keep_secret}
                onChange={handleChange}
              />
              Member was told to keep this secret
            </label>
          </div>

          <div className="field-group" style={{ marginTop: "16px" }}>
            <label>Staff Narrative</label>
            <textarea name="narrative" value={form.narrative} onChange={handleChange} />
          </div>
        </div>

        <div className="card">
          <h2>Risk Indicators</h2>
          <div className="form-grid-2" style={{ marginTop: "16px" }}>
            <label className="checkbox-row">
              <input type="checkbox" name="phone_based_imposter_story" checked={form.phone_based_imposter_story} onChange={handleChange} />
              Phone-based imposter story
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="government_or_bank_brand_impersonation" checked={form.government_or_bank_brand_impersonation} onChange={handleChange} />
              Bank or government impersonation
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="fear_or_urgency_language" checked={form.fear_or_urgency_language} onChange={handleChange} />
              Fear or urgency language used
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="secrecy_pressure" checked={form.secrecy_pressure} onChange={handleChange} />
              Secrecy pressure
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="high_dollar_amount" checked={form.high_dollar_amount} onChange={handleChange} />
              High-dollar loss potential
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="older_or_vulnerable_customer" checked={form.older_or_vulnerable_customer} onChange={handleChange} />
              Older or vulnerable member
            </label>

            <label className="checkbox-row">
              <input type="checkbox" name="repeat_attempt" checked={form.repeat_attempt} onChange={handleChange} />
              Repeat or ongoing attempt
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
              Romance or emotional dependency pattern
            </label>
          </div>
        </div>

        <div className="button-row">
          <button className="button" type="submit">Create Case</button>
          <a href="/ops">Cancel</a>
        </div>

        {error && <p className="error">{error}</p>}
      </form>
    </main>
  );
}
