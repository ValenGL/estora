"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AssessmentStep from "../../../shared/components/assessmentStep/assessmentStep";
import AssessmentResults from "../../../shared/components/assessmentResults/assessmentResults";
import { createSellerProfile, getOwnSeller } from "../../lib/supabase/sellers";
import { ASSESSMENT_CATEGORIES } from "../../lib/data/sellerAssessment";
import { US_STATES } from "../../lib/data/usStates";
import type { BusinessType, WorkType, ManagementType } from "../../lib/types";
import ProtectedRoute from "../../utils/protectedRoute";
import "./onboarding.scss";

interface BusinessFormData {
  company_name: string;
  annual_revenue: string;
  ebitda: string;
  phone: string;
  website: string;
  state: string;
  employee_count: string;
  years_in_business: string;
  business_type: BusinessType | "";
  work_type: WorkType | "";
  software: string;
  management_type: ManagementType | "";
}

const TOTAL_CATEGORIES = ASSESSMENT_CATEGORIES.length;

const SellerOnboardingPage = () => {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [form, setForm] = useState<BusinessFormData>({
    company_name: '',
    annual_revenue: '',
    ebitda: '',
    phone: '',
    website: '',
    state: '',
    employee_count: '',
    years_in_business: '',
    business_type: '',
    work_type: '',
    software: '',
    management_type: '',
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getOwnSeller()
      .then((existing) => {
        if (existing) router.replace('/inicio');
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  if (checking) return null;

  const handleAnswer = (questionIndex: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: score }));
  };

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setSubmitError(null);
    try {
      await createSellerProfile({
        company_name: form.company_name,
        annual_revenue: parseFloat(form.annual_revenue) * 1_000_000,
        ebitda: parseFloat(form.ebitda) * 100_000,
        phone: form.phone || null,
        website: form.website || null,
        state: form.state,
        employee_count: parseInt(form.employee_count, 10),
        years_in_business: parseInt(form.years_in_business, 10),
        business_type: form.business_type as BusinessType,
        work_type: form.work_type as WorkType,
        software: form.software.trim(),
        management_type: form.management_type as ManagementType,
      });
      setStep(TOTAL_CATEGORIES + 2);
    } catch {
      setSubmitError('Error saving your data. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const isFormValid =
    form.company_name.trim() !== '' &&
    !isNaN(parseFloat(form.annual_revenue)) && parseFloat(form.annual_revenue) >= 0 &&
    !isNaN(parseFloat(form.ebitda)) && parseFloat(form.ebitda) >= 0 &&
    form.state !== '' &&
    !isNaN(parseInt(form.employee_count, 10)) && parseInt(form.employee_count, 10) >= 1 &&
    !isNaN(parseInt(form.years_in_business, 10)) && parseInt(form.years_in_business, 10) >= 0 &&
    form.business_type !== '' &&
    form.work_type !== '' &&
    form.software.trim() !== '' &&
    form.management_type !== '';

  if (step >= 1 && step <= TOTAL_CATEGORIES) {
    const categoryIndex = step - 1;
    return (
      <AssessmentStep
        categoryIndex={categoryIndex}
        answers={answers}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onBack={categoryIndex > 0 ? handleBack : undefined}
      />
    );
  }

  if (step === TOTAL_CATEGORIES + 1) {
    return (
      <div className="seller-onboarding-form">
        <div>
          <h2>Almost done</h2>
          <p>Tell us a bit about your business so we can complete your profile.</p>
        </div>

        <form onSubmit={handleBusinessSubmit} className="seller-onboarding-fields">
          {/* Company name */}
          <div className="seller-onboarding-field">
            <label htmlFor="company_name">Business Name *</label>
            <input
              id="company_name"
              name="company_name"
              type="text"
              value={form.company_name}
              onChange={handleFormChange}
              placeholder="Acme Roofing Co."
              required
              disabled={submitLoading}
            />
          </div>

          {/* Revenue */}
          <div className="seller-onboarding-field">
            <label htmlFor="annual_revenue">2026 Total Revenues (in millions) *</label>
            <input
              id="annual_revenue"
              name="annual_revenue"
              type="number"
              step="0.1"
              min="0"
              value={form.annual_revenue}
              onChange={handleFormChange}
              placeholder="4.5"
              required
              disabled={submitLoading}
            />
          </div>

          {/* EBITDA */}
          <div className="seller-onboarding-field">
            <label htmlFor="ebitda">2026 Earnings (in hundred thousands) *</label>
            <input
              id="ebitda"
              name="ebitda"
              type="number"
              step="0.1"
              min="0"
              value={form.ebitda}
              onChange={handleFormChange}
              placeholder="12"
              required
              disabled={submitLoading}
            />
          </div>

          {/* State */}
          <div className="seller-onboarding-field">
            <label htmlFor="state">State *</label>
            <select
              id="state"
              name="state"
              className="seller-onboarding-select"
              value={form.state}
              onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
              required
              disabled={submitLoading}
            >
              <option value="">Select a state...</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Employee count + Years in business */}
          <div className="seller-onboarding-field-row">
            <div className="seller-onboarding-field">
              <label htmlFor="employee_count">Employees *</label>
              <input
                id="employee_count"
                name="employee_count"
                type="number"
                min="1"
                step="1"
                value={form.employee_count}
                onChange={handleFormChange}
                placeholder="25"
                required
                disabled={submitLoading}
              />
            </div>
            <div className="seller-onboarding-field">
              <label htmlFor="years_in_business">Years in Business *</label>
              <input
                id="years_in_business"
                name="years_in_business"
                type="number"
                min="0"
                step="1"
                value={form.years_in_business}
                onChange={handleFormChange}
                placeholder="8"
                required
                disabled={submitLoading}
              />
            </div>
          </div>

          {/* Business type */}
          <div className="seller-onboarding-field">
            <label>Business Type *</label>
            <div className="seller-onboarding-radio-group">
              {(["residential", "commercial", "both"] as BusinessType[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`seller-onboarding-radio-btn${form.business_type === opt ? " seller-onboarding-radio-btn--selected" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, business_type: opt }))}
                  disabled={submitLoading}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Work type */}
          <div className="seller-onboarding-field">
            <label>Work Type *</label>
            <div className="seller-onboarding-radio-group">
              {(["retail", "insurance", "both"] as WorkType[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`seller-onboarding-radio-btn${form.work_type === opt ? " seller-onboarding-radio-btn--selected" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, work_type: opt }))}
                  disabled={submitLoading}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Software */}
          <div className="seller-onboarding-field">
            <label htmlFor="software">Field Management Software *</label>
            <input
              id="software"
              name="software"
              type="text"
              value={form.software}
              onChange={handleFormChange}
              placeholder="Jobber, AccuLynx, ServiceTitan..."
              required
              disabled={submitLoading}
            />
          </div>

          {/* Management type */}
          <div className="seller-onboarding-field">
            <label>Management Structure *</label>
            <div className="seller-onboarding-radio-group">
              {(["owner_operated", "has_management_team"] as ManagementType[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`seller-onboarding-radio-btn${form.management_type === opt ? " seller-onboarding-radio-btn--selected" : ""}`}
                  onClick={() => setForm((prev) => ({ ...prev, management_type: opt }))}
                  disabled={submitLoading}
                >
                  {opt.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Phone (optional) */}
          <div className="seller-onboarding-field">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleFormChange}
              placeholder="+1 (555) 000-0000"
              disabled={submitLoading}
            />
          </div>

          {/* Website (optional) */}
          <div className="seller-onboarding-field">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="url"
              value={form.website}
              onChange={handleFormChange}
              placeholder="https://yourbusiness.com"
              disabled={submitLoading}
            />
          </div>

          {submitError && (
            <p className="seller-onboarding-error">{submitError}</p>
          )}

          <button
            type="submit"
            className="seller-onboarding-submit"
            disabled={!isFormValid || submitLoading}
          >
            {submitLoading ? 'Saving...' : 'View my results →'}
          </button>
        </form>
      </div>
    );
  }

  if (step === TOTAL_CATEGORIES + 2) {
    return (
      <AssessmentResults
        answers={answers}
        businessName={form.company_name}
        onFinish={() => router.push('/inicio')}
      />
    );
  }

  return null;
};

export default ProtectedRoute(SellerOnboardingPage);
