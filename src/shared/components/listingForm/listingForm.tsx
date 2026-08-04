"use client";

import { useState } from "react";
import type { BrokerSellerInput } from "../../../app/lib/supabase/brokerSellers";
import type { BusinessType, WorkType, ManagementType, SellerStatus } from "../../../app/lib/types";
import { US_STATES } from "../../../app/lib/data/usStates";
import "./listingForm.scss";

interface ListingFormProps {
  initialValues?: Partial<BrokerSellerInput>;
  onSubmit: (data: BrokerSellerInput) => Promise<void>;
  submitLabel: string;
  onCancel: () => void;
}

interface FormState {
  company_name: string;
  annual_revenue: string;
  ebitda: string;
  asking_price: string;
  state: string;
  employee_count: string;
  years_in_business: string;
  business_type: BusinessType | "";
  work_type: WorkType | "";
  software: string;
  management_type: ManagementType | "";
  status: SellerStatus | "";
  phone: string;
  website: string;
}

function initForm(v?: Partial<BrokerSellerInput>): FormState {
  return {
    company_name: v?.company_name ?? "",
    annual_revenue: v?.annual_revenue != null ? String(v.annual_revenue / 1_000_000) : "",
    ebitda: v?.ebitda != null ? String(v.ebitda / 100_000) : "",
    asking_price: v?.asking_price != null ? String(v.asking_price / 1_000_000) : "",
    state: v?.state ?? "",
    employee_count: v?.employee_count != null ? String(v.employee_count) : "",
    years_in_business: v?.years_in_business != null ? String(v.years_in_business) : "",
    business_type: v?.business_type ?? "",
    work_type: v?.work_type ?? "",
    software: v?.software ?? "",
    management_type: v?.management_type ?? "",
    status: v?.status ?? "",
    phone: v?.phone ?? "",
    website: v?.website ?? "",
  };
}

export default function ListingForm({ initialValues, onSubmit, submitLabel, onCancel }: ListingFormProps) {
  const [form, setForm] = useState<FormState>(() => initForm(initialValues));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (name: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const revNum = parseFloat(form.annual_revenue);
  const ebitdaNum = parseFloat(form.ebitda);
  const askNum = parseFloat(form.asking_price);
  const empNum = parseInt(form.employee_count, 10);
  const yrsNum = parseInt(form.years_in_business, 10);

  const isValid =
    form.company_name.trim() !== "" &&
    !isNaN(revNum) && revNum >= 0 &&
    !isNaN(ebitdaNum) && ebitdaNum >= 0 &&
    (form.asking_price === "" || (!isNaN(askNum) && askNum >= 0)) &&
    form.state !== "" &&
    !isNaN(empNum) && empNum >= 1 &&
    !isNaN(yrsNum) && yrsNum >= 0 &&
    form.business_type !== "" &&
    form.work_type !== "" &&
    form.software.trim() !== "" &&
    form.management_type !== "" &&
    form.status !== "";

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        company_name: form.company_name.trim(),
        annual_revenue: revNum * 1_000_000,
        ebitda: ebitdaNum * 100_000,
        asking_price: form.asking_price !== "" ? askNum * 1_000_000 : null,
        state: form.state,
        employee_count: empNum,
        years_in_business: yrsNum,
        business_type: form.business_type as BusinessType,
        work_type: form.work_type as WorkType,
        software: form.software.trim(),
        management_type: form.management_type as ManagementType,
        status: form.status as SellerStatus,
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
      });
    } catch {
      setError("Failed to save. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="listing-form">
      <div className="listing-form-field">
        <label htmlFor="company_name">Company name *</label>
        <input id="company_name" type="text" value={form.company_name} onChange={set("company_name")} disabled={submitting} />
      </div>

      <div className="listing-form-row">
        <div className="listing-form-field">
          <label htmlFor="annual_revenue">Revenue (millions) *</label>
          <input id="annual_revenue" type="number" step="0.1" min="0" value={form.annual_revenue} onChange={set("annual_revenue")} disabled={submitting} />
        </div>
        <div className="listing-form-field">
          <label htmlFor="ebitda">EBITDA (hundred thousands) *</label>
          <input id="ebitda" type="number" step="0.1" min="0" value={form.ebitda} onChange={set("ebitda")} disabled={submitting} />
        </div>
      </div>

      <div className="listing-form-row">
        <div className="listing-form-field">
          <label htmlFor="asking_price">Asking price (millions)</label>
          <input id="asking_price" type="number" step="0.1" min="0" value={form.asking_price} onChange={set("asking_price")} disabled={submitting} />
        </div>
        <div className="listing-form-field">
          <label htmlFor="state">State *</label>
          <select id="state" value={form.state} onChange={set("state")} disabled={submitting}>
            <option value="">Select a state...</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="listing-form-row">
        <div className="listing-form-field">
          <label htmlFor="employee_count">Employees *</label>
          <input id="employee_count" type="number" min="1" step="1" value={form.employee_count} onChange={set("employee_count")} disabled={submitting} />
        </div>
        <div className="listing-form-field">
          <label htmlFor="years_in_business">Years in business *</label>
          <input id="years_in_business" type="number" min="0" step="1" value={form.years_in_business} onChange={set("years_in_business")} disabled={submitting} />
        </div>
      </div>

      <div className="listing-form-field">
        <label>Business type *</label>
        <div className="listing-form-radio-group">
          {(["residential", "commercial", "both"] as BusinessType[]).map((opt) => (
            <button key={opt} type="button"
              className={`listing-form-radio-btn${form.business_type === opt ? " listing-form-radio-btn--selected" : ""}`}
              onClick={() => setForm((p) => ({ ...p, business_type: opt }))}
              disabled={submitting}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="listing-form-field">
        <label>Work type *</label>
        <div className="listing-form-radio-group">
          {(["retail", "insurance", "both"] as WorkType[]).map((opt) => (
            <button key={opt} type="button"
              className={`listing-form-radio-btn${form.work_type === opt ? " listing-form-radio-btn--selected" : ""}`}
              onClick={() => setForm((p) => ({ ...p, work_type: opt }))}
              disabled={submitting}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="listing-form-field">
        <label htmlFor="software">Software *</label>
        <input id="software" type="text" value={form.software} onChange={set("software")} disabled={submitting} />
      </div>

      <div className="listing-form-field">
        <label>Management *</label>
        <div className="listing-form-radio-group">
          {(["owner_operated", "has_management_team"] as ManagementType[]).map((opt) => (
            <button key={opt} type="button"
              className={`listing-form-radio-btn${form.management_type === opt ? " listing-form-radio-btn--selected" : ""}`}
              onClick={() => setForm((p) => ({ ...p, management_type: opt }))}
              disabled={submitting}>
              {opt.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="listing-form-field">
        <label htmlFor="status">Status *</label>
        <select id="status" value={form.status} onChange={set("status")} disabled={submitting}>
          <option value="">Select a status...</option>
          <option value="active">Active</option>
          <option value="under_nda">Under NDA</option>
          <option value="sold">Sold</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="listing-form-row">
        <div className="listing-form-field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" type="tel" value={form.phone} onChange={set("phone")} disabled={submitting} />
        </div>
        <div className="listing-form-field">
          <label htmlFor="website">Website</label>
          <input id="website" type="url" value={form.website} onChange={set("website")} disabled={submitting} />
        </div>
      </div>

      {error && <p className="listing-form-error">{error}</p>}

      <div className="listing-form-actions">
        <button className="listing-form-btn listing-form-btn--primary" onClick={handleSubmit} disabled={!isValid || submitting} type="button">
          {submitting ? "Saving..." : submitLabel}
        </button>
        <button className="listing-form-btn listing-form-btn--ghost" onClick={onCancel} disabled={submitting} type="button">
          Cancel
        </button>
      </div>
    </div>
  );
}
