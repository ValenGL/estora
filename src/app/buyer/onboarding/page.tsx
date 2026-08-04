"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBuyer, getOwnBuyer } from "../../lib/supabase/buyers";
import { US_STATES } from "../../lib/data/usStates";
import ProtectedRoute from "../../utils/protectedRoute";
import type { BuyerBusinessType, BuyerWorkType, ManagementPreference } from "../../lib/types";
import "./onboarding.scss";

interface WizardForm {
  organization_name: string;
  revenue_min: string;
  revenue_max: string;
  ebitda_min: string;
  ebitda_max: string;
  target_states: string[];
  business_type: BuyerBusinessType | "";
  work_type: BuyerWorkType | "";
  employee_min: string;
  employee_max: string;
  preferred_software: string;
  management_preference: ManagementPreference | "";
}

const TOTAL_STEPS = 5;

const BuyerOnboardingPage = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [checking, setChecking] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form, setForm] = useState<WizardForm>({
    organization_name: "",
    revenue_min: "",
    revenue_max: "",
    ebitda_min: "",
    ebitda_max: "",
    target_states: [],
    business_type: "",
    work_type: "",
    employee_min: "",
    employee_max: "",
    preferred_software: "",
    management_preference: "",
  });

  useEffect(() => {
    getOwnBuyer()
      .then((existing) => {
        if (existing) router.replace("/inicio");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  if (checking) return null;

  const toggleState = (code: string) =>
    setForm((prev) => ({
      ...prev,
      target_states: prev.target_states.includes(code)
        ? prev.target_states.filter((s) => s !== code)
        : [...prev.target_states, code],
    }));

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await createBuyer({
        organization_name: form.organization_name.trim(),
        revenue_min: parseFloat(form.revenue_min) * 1_000_000,
        revenue_max: parseFloat(form.revenue_max) * 1_000_000,
        ebitda_min: parseFloat(form.ebitda_min) * 100_000,
        ebitda_max: parseFloat(form.ebitda_max) * 100_000,
        target_states: form.target_states,
        business_type: form.business_type as BuyerBusinessType,
        work_type: form.work_type as BuyerWorkType,
        employee_min: parseInt(form.employee_min, 10),
        employee_max: parseInt(form.employee_max, 10),
        preferred_software: form.preferred_software.trim(),
        management_preference: form.management_preference as ManagementPreference,
      });
      setStep(TOTAL_STEPS + 1);
    } catch {
      setSubmitError("Error saving your profile. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const revMin = parseFloat(form.revenue_min);
  const revMax = parseFloat(form.revenue_max);
  const ebitdaMin = parseFloat(form.ebitda_min);
  const ebitdaMax = parseFloat(form.ebitda_max);
  const empMin = parseInt(form.employee_min, 10);
  const empMax = parseInt(form.employee_max, 10);

  const isStep1Valid =
    form.organization_name.trim().length >= 2 &&
    form.organization_name.trim().length <= 100;
  const isStep2Valid =
    !isNaN(revMin) && !isNaN(revMax) &&
    !isNaN(ebitdaMin) && !isNaN(ebitdaMax) &&
    revMin >= 0 && revMax >= 0 &&
    ebitdaMin >= 0 && ebitdaMax >= 0 &&
    revMin <= revMax && ebitdaMin <= ebitdaMax;
  const isStep3Valid = form.target_states.length >= 1;
  const isStep4Valid =
    form.business_type !== "" && form.work_type !== "" &&
    !isNaN(empMin) && !isNaN(empMax) &&
    empMin >= 0 && empMin <= empMax;
  const isStep5Valid =
    form.preferred_software.trim() !== "" &&
    form.management_preference !== "";

  const Progress = () => (
    <div className="buyer-progress">
      <span className="buyer-progress__label">
        Step {step} of {TOTAL_STEPS}
      </span>
      <div className="buyer-progress__bar">
        <div
          className="buyer-progress__fill"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );

  // Step 1: Organization
  if (step === 1) {
    return (
      <div className="buyer-onboarding-step">
        <Progress />
        <h2 className="buyer-step-title">Your organization</h2>
        <div className="buyer-field">
          <label htmlFor="organization_name">Organization name *</label>
          <input
            id="organization_name"
            type="text"
            value={form.organization_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, organization_name: e.target.value }))
            }
            placeholder="Acme Capital Partners"
            maxLength={100}
            autoFocus
          />
        </div>
        <div className="buyer-nav">
          <span />
          <button
            className="buyer-btn buyer-btn--primary"
            onClick={handleNext}
            disabled={!isStep1Valid}
            type="button"
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Financials
  if (step === 2) {
    return (
      <div className="buyer-onboarding-step">
        <Progress />
        <h2 className="buyer-step-title">Revenue & EBITDA range</h2>
        <div className="buyer-field-row">
          <div className="buyer-field">
            <label htmlFor="revenue_min">Revenue min (millions) *</label>
            <input
              id="revenue_min"
              type="number"
              min="0"
              step="0.1"
              value={form.revenue_min}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, revenue_min: e.target.value }))
              }
              placeholder="1"
            />
          </div>
          <div className="buyer-field">
            <label htmlFor="revenue_max">Revenue max (millions) *</label>
            <input
              id="revenue_max"
              type="number"
              min="0"
              step="0.1"
              value={form.revenue_max}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, revenue_max: e.target.value }))
              }
              placeholder="10"
            />
          </div>
        </div>
        <div className="buyer-field-row">
          <div className="buyer-field">
            <label htmlFor="ebitda_min">EBITDA min (hundred thousands) *</label>
            <input
              id="ebitda_min"
              type="number"
              min="0"
              step="0.1"
              value={form.ebitda_min}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ebitda_min: e.target.value }))
              }
              placeholder="1"
            />
          </div>
          <div className="buyer-field">
            <label htmlFor="ebitda_max">EBITDA max (hundred thousands) *</label>
            <input
              id="ebitda_max"
              type="number"
              min="0"
              step="0.1"
              value={form.ebitda_max}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, ebitda_max: e.target.value }))
              }
              placeholder="10"
            />
          </div>
        </div>
        <div className="buyer-nav">
          <button className="buyer-btn" onClick={handleBack} type="button">
            ← Back
          </button>
          <button
            className="buyer-btn buyer-btn--primary"
            onClick={handleNext}
            disabled={!isStep2Valid}
            type="button"
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Geography
  if (step === 3) {
    return (
      <div className="buyer-onboarding-step">
        <Progress />
        <h2 className="buyer-step-title">Target states</h2>
        <p style={{ opacity: 0.6, fontSize: "0.9rem" }}>
          Select at least one state where you want to acquire.
        </p>
        <div className="buyer-states-grid">
          {US_STATES.map((state) => (
            <button
              key={state.code}
              type="button"
              className={`buyer-state-btn${
                form.target_states.includes(state.code)
                  ? " buyer-state-btn--selected"
                  : ""
              }`}
              onClick={() => toggleState(state.code)}
              title={state.label}
            >
              {state.code}
            </button>
          ))}
        </div>
        <div className="buyer-nav">
          <button className="buyer-btn" onClick={handleBack} type="button">
            ← Back
          </button>
          <button
            className="buyer-btn buyer-btn--primary"
            onClick={handleNext}
            disabled={!isStep3Valid}
            type="button"
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Business Profile
  if (step === 4) {
    const businessTypeOptions: BuyerBusinessType[] = [
      "residential",
      "commercial",
      "both",
      "any",
    ];
    const workTypeOptions: BuyerWorkType[] = [
      "retail",
      "insurance",
      "both",
      "any",
    ];

    return (
      <div className="buyer-onboarding-step">
        <Progress />
        <h2 className="buyer-step-title">Business profile</h2>

        <div className="buyer-field">
          <label>Business type *</label>
          <div className="buyer-radio-group">
            {businessTypeOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`buyer-radio-btn${
                  form.business_type === opt
                    ? " buyer-radio-btn--selected"
                    : ""
                }`}
                onClick={() =>
                  setForm((prev) => ({ ...prev, business_type: opt }))
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="buyer-field">
          <label>Work type *</label>
          <div className="buyer-radio-group">
            {workTypeOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`buyer-radio-btn${
                  form.work_type === opt ? " buyer-radio-btn--selected" : ""
                }`}
                onClick={() =>
                  setForm((prev) => ({ ...prev, work_type: opt }))
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="buyer-field-row">
          <div className="buyer-field">
            <label htmlFor="employee_min">Min employees *</label>
            <input
              id="employee_min"
              type="number"
              min="0"
              step="1"
              value={form.employee_min}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, employee_min: e.target.value }))
              }
              placeholder="5"
            />
          </div>
          <div className="buyer-field">
            <label htmlFor="employee_max">Max employees *</label>
            <input
              id="employee_max"
              type="number"
              min="0"
              step="1"
              value={form.employee_max}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, employee_max: e.target.value }))
              }
              placeholder="50"
            />
          </div>
        </div>

        <div className="buyer-nav">
          <button className="buyer-btn" onClick={handleBack} type="button">
            ← Back
          </button>
          <button
            className="buyer-btn buyer-btn--primary"
            onClick={handleNext}
            disabled={!isStep4Valid}
            type="button"
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Operational Preferences
  if (step === 5) {
    const mgmtOptions: ManagementPreference[] = [
      "owner_operated",
      "has_management_team",
      "any",
    ];

    return (
      <div className="buyer-onboarding-step">
        <Progress />
        <h2 className="buyer-step-title">Operational preferences</h2>

        <div className="buyer-field">
          <label htmlFor="preferred_software">Preferred software *</label>
          <input
            id="preferred_software"
            type="text"
            value={form.preferred_software}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                preferred_software: e.target.value,
              }))
            }
            placeholder="Jobber, AccuLynx, any..."
          />
        </div>

        <div className="buyer-field">
          <label>Management preference *</label>
          <div className="buyer-radio-group">
            {mgmtOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                className={`buyer-radio-btn${
                  form.management_preference === opt
                    ? " buyer-radio-btn--selected"
                    : ""
                }`}
                onClick={() =>
                  setForm((prev) => ({ ...prev, management_preference: opt }))
                }
              >
                {opt.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {submitError && <p className="buyer-error">{submitError}</p>}

        <div className="buyer-nav">
          <button className="buyer-btn" onClick={handleBack} type="button">
            ← Back
          </button>
          <button
            className="buyer-btn buyer-btn--primary"
            onClick={handleSubmit}
            disabled={!isStep5Valid || submitLoading}
            type="button"
          >
            {submitLoading ? "Saving..." : "Complete →"}
          </button>
        </div>
      </div>
    );
  }

  // Step 6: Confirmation
  if (step === TOTAL_STEPS + 1) {
    const formatRevenue = (v: string) => `$${parseFloat(v)}M`;
    const formatEbitda = (v: string) => `$${parseFloat(v) * 100}K`;

    return (
      <div className="buyer-confirmation">
        <div>
          <h2>Your Buy Box is set!</h2>
          <p>
            Here&apos;s a summary of your acquisition criteria. You can update
            these from your profile later.
          </p>
        </div>

        <div className="buyer-summary-grid">
          <div className="buyer-summary-card">
            <span className="buyer-summary-card__label">Organization</span>
            <span className="buyer-summary-card__value">
              {form.organization_name}
            </span>
          </div>
          <div className="buyer-summary-card">
            <span className="buyer-summary-card__label">Revenue range</span>
            <span className="buyer-summary-card__value">
              {formatRevenue(form.revenue_min)} –{" "}
              {formatRevenue(form.revenue_max)}
            </span>
          </div>
          <div className="buyer-summary-card">
            <span className="buyer-summary-card__label">EBITDA range</span>
            <span className="buyer-summary-card__value">
              {formatEbitda(form.ebitda_min)} –{" "}
              {formatEbitda(form.ebitda_max)}
            </span>
          </div>
          <div className="buyer-summary-card">
            <span className="buyer-summary-card__label">Target states</span>
            <span className="buyer-summary-card__value">
              {form.target_states.join(", ")}
            </span>
          </div>
          <div className="buyer-summary-card">
            <span className="buyer-summary-card__label">Business type</span>
            <span className="buyer-summary-card__value">
              {form.business_type}
            </span>
          </div>
          <div className="buyer-summary-card">
            <span className="buyer-summary-card__label">Work type</span>
            <span className="buyer-summary-card__value">{form.work_type}</span>
          </div>
          <div className="buyer-summary-card">
            <span className="buyer-summary-card__label">Employee range</span>
            <span className="buyer-summary-card__value">
              {form.employee_min} – {form.employee_max}
            </span>
          </div>
          <div className="buyer-summary-card">
            <span className="buyer-summary-card__label">Software</span>
            <span className="buyer-summary-card__value">
              {form.preferred_software}
            </span>
          </div>
          <div className="buyer-summary-card">
            <span className="buyer-summary-card__label">Management</span>
            <span className="buyer-summary-card__value">
              {form.management_preference.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        <div className="buyer-confirmation-actions">
          <button
            className="buyer-confirmation-btn"
            onClick={() => router.push("/inicio")}
            type="button"
          >
            Go to dashboard →
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ProtectedRoute(BuyerOnboardingPage);
