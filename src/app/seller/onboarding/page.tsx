"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AssessmentStep from "../../../shared/components/assessmentStep/assessmentStep";
import AssessmentResults from "../../../shared/components/assessmentResults/assessmentResults";
import { createSellerProfile, getOwnSeller } from "../../lib/supabase/sellers";
import { ASSESSMENT_CATEGORIES } from "../../lib/data/sellerAssessment";
import ProtectedRoute from "../../utils/protectedRoute";
import "./onboarding.scss";

interface BusinessFormData {
  company_name: string;
  annual_revenue: string;
  ebitda: string;
  phone: string;
  website: string;
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
    !isNaN(parseFloat(form.annual_revenue)) &&
    !isNaN(parseFloat(form.ebitda));

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
