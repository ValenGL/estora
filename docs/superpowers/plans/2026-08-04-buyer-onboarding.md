# Buyer Onboarding Wizard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 5-step Buy Box wizard at `/buyer/onboarding` that collects acquisition criteria and creates the buyer's profile in Supabase, activated immediately after the existing `/onboarding` role+username flow for buyers.

**Architecture:** The existing `/onboarding/page.tsx` receives a one-line change: after username is saved, buyers redirect to `/buyer/onboarding` instead of `/inicio`. The new route is a client-side wizard holding all answers in local state. A single Supabase write via `createBuyer` happens on step 5 submit. Step 6 is a confirmation screen. `getOwnBuyer` guards the route on mount — if a buyer profile already exists, redirect to `/inicio`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase client, SCSS + Tailwind CSS

## Global Constraints

- No test framework — use `npx tsc --noEmit` as the type-check gate after each task.
- All role-aware components use `effectiveRole` from `useAuth()`, not `role`.
- `"use client"` directive required on all interactive components. Import local `.scss` inside each component.
- Color tokens: `estora-white #fafafa`, `estora-dark #166088`, `estora-black #0a1310`, `estora-gray #5d6a66`, `estora-primary #4A6FA5`.
- Types live in `src/app/lib/types.ts` — do not redefine them in other files.
- All Supabase calls go through `src/app/lib/supabase/` modules — never call Supabase directly from components.
- Financial inputs use display units: revenue "in millions" (`* 1_000_000`), EBITDA "in hundred thousands" (`* 100_000`).
- Do not reference `posts`, `addPost`, `getPosts`, or any legacy posts API.

---

### Task 1: Create `usStates.ts` — static US states data

**Files:**
- Create: `src/app/lib/data/usStates.ts`

**Interfaces:**
- Produces: `US_STATES: { code: string; label: string }[]` — exported const, length 50. Task 2 imports this.

- [ ] **Step 1: Create `src/app/lib/data/usStates.ts`**

  ```ts
  export const US_STATES: { code: string; label: string }[] = [
    { code: 'AK', label: 'Alaska' },
    { code: 'AL', label: 'Alabama' },
    { code: 'AR', label: 'Arkansas' },
    { code: 'AZ', label: 'Arizona' },
    { code: 'CA', label: 'California' },
    { code: 'CO', label: 'Colorado' },
    { code: 'CT', label: 'Connecticut' },
    { code: 'DE', label: 'Delaware' },
    { code: 'FL', label: 'Florida' },
    { code: 'GA', label: 'Georgia' },
    { code: 'HI', label: 'Hawaii' },
    { code: 'IA', label: 'Iowa' },
    { code: 'ID', label: 'Idaho' },
    { code: 'IL', label: 'Illinois' },
    { code: 'IN', label: 'Indiana' },
    { code: 'KS', label: 'Kansas' },
    { code: 'KY', label: 'Kentucky' },
    { code: 'LA', label: 'Louisiana' },
    { code: 'MA', label: 'Massachusetts' },
    { code: 'MD', label: 'Maryland' },
    { code: 'ME', label: 'Maine' },
    { code: 'MI', label: 'Michigan' },
    { code: 'MN', label: 'Minnesota' },
    { code: 'MO', label: 'Missouri' },
    { code: 'MS', label: 'Mississippi' },
    { code: 'MT', label: 'Montana' },
    { code: 'NC', label: 'North Carolina' },
    { code: 'ND', label: 'North Dakota' },
    { code: 'NE', label: 'Nebraska' },
    { code: 'NH', label: 'New Hampshire' },
    { code: 'NJ', label: 'New Jersey' },
    { code: 'NM', label: 'New Mexico' },
    { code: 'NV', label: 'Nevada' },
    { code: 'NY', label: 'New York' },
    { code: 'OH', label: 'Ohio' },
    { code: 'OK', label: 'Oklahoma' },
    { code: 'OR', label: 'Oregon' },
    { code: 'PA', label: 'Pennsylvania' },
    { code: 'RI', label: 'Rhode Island' },
    { code: 'SC', label: 'South Carolina' },
    { code: 'SD', label: 'South Dakota' },
    { code: 'TN', label: 'Tennessee' },
    { code: 'TX', label: 'Texas' },
    { code: 'UT', label: 'Utah' },
    { code: 'VA', label: 'Virginia' },
    { code: 'VT', label: 'Vermont' },
    { code: 'WA', label: 'Washington' },
    { code: 'WI', label: 'Wisconsin' },
    { code: 'WV', label: 'West Virginia' },
    { code: 'WY', label: 'Wyoming' },
  ];
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/lib/data/usStates.ts
  git commit -m "feat: add US states static data for buyer onboarding"
  ```

---

### Task 2: Create buyer onboarding wizard (`onboarding.scss` + `page.tsx`)

**Files:**
- Create: `src/app/buyer/onboarding/onboarding.scss`
- Create: `src/app/buyer/onboarding/page.tsx`

**Interfaces:**
- Consumes:
  - `US_STATES` from `src/app/lib/data/usStates.ts` (Task 1)
  - `createBuyer, getOwnBuyer` from `src/app/lib/supabase/buyers.ts` (already exist)
  - `BuyerBusinessType, BuyerWorkType, ManagementPreference` from `src/app/lib/types.ts` (already exist)
  - `ProtectedRoute` from `src/app/utils/protectedRoute.tsx` (already exists)
- Produces: `/buyer/onboarding` route — full 5-step wizard + confirmation screen

- [ ] **Step 1: Create `src/app/buyer/onboarding/onboarding.scss`**

  ```scss
  .buyer-onboarding-step {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    max-width: 600px;
    margin: 0 auto;
    padding: 2rem 1rem;
    min-height: 100dvh;
  }

  .buyer-progress {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &__label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.5;
    }

    &__bar {
      height: 4px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.1);
      overflow: hidden;
    }

    &__fill {
      height: 100%;
      border-radius: 999px;
      background: var(--estora-primary, #4A6FA5);
      transition: width 0.3s ease;
    }
  }

  .buyer-step-title {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .buyer-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    label {
      font-size: 0.8rem;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    input {
      width: 100%;
      padding: 0.55rem 0.75rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: var(--estora-white, #fafafa);
      font-size: 0.95rem;

      &::placeholder {
        opacity: 0.35;
      }

      &:focus {
        outline: none;
        border-color: var(--estora-primary, #4A6FA5);
      }
    }
  }

  .buyer-field-row {
    display: flex;
    gap: 1rem;

    > .buyer-field {
      flex: 1;
    }
  }

  .buyer-radio-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .buyer-radio-btn {
    padding: 0.4rem 0.9rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: transparent;
    color: var(--estora-white, #fafafa);
    font-size: 0.85rem;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
    text-transform: capitalize;

    &:hover:not(.buyer-radio-btn--selected) {
      border-color: rgba(255, 255, 255, 0.4);
    }

    &--selected {
      border-color: var(--estora-primary, #4A6FA5);
      background: rgba(74, 111, 165, 0.2);
      font-weight: 600;
    }
  }

  .buyer-states-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;

    @media (min-width: 480px) {
      grid-template-columns: repeat(4, 1fr);
    }

    @media (min-width: 640px) {
      grid-template-columns: repeat(6, 1fr);
    }
  }

  .buyer-state-btn {
    padding: 0.4rem 0.25rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: transparent;
    color: var(--estora-white, #fafafa);
    font-size: 0.75rem;
    cursor: pointer;
    text-align: center;
    transition: border-color 0.12s ease, background 0.12s ease;

    &:hover:not(.buyer-state-btn--selected) {
      border-color: rgba(255, 255, 255, 0.35);
    }

    &--selected {
      border-color: var(--estora-primary, #4A6FA5);
      background: rgba(74, 111, 165, 0.2);
      font-weight: 600;
    }
  }

  .buyer-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    margin-top: auto;
  }

  .buyer-btn {
    padding: 0.6rem 1.5rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.3);
    background: transparent;
    color: var(--estora-white, #fafafa);
    font-size: 0.9rem;
    cursor: pointer;
    transition: opacity 0.15s ease;

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    &--primary {
      background: var(--estora-primary, #4A6FA5);
      border-color: var(--estora-primary, #4A6FA5);
      font-weight: 600;
    }
  }

  .buyer-error {
    color: #ef4444;
    font-size: 0.85rem;
  }

  .buyer-confirmation {
    max-width: 600px;
    margin: 0 auto;
    padding: 3rem 1rem 4rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;

    h2 {
      font-size: 2rem;
      font-weight: 800;
    }

    p {
      opacity: 0.6;
      font-size: 0.9rem;
    }
  }

  .buyer-summary-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;

    @media (min-width: 480px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  .buyer-summary-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &__label {
      font-size: 0.75rem;
      font-weight: 600;
      opacity: 0.5;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    &__value {
      font-size: 1rem;
      font-weight: 500;
    }
  }

  .buyer-confirmation-actions {
    display: flex;
    justify-content: center;
  }

  .buyer-confirmation-btn {
    padding: 0.7rem 2rem;
    border-radius: 8px;
    border: none;
    background: var(--estora-primary, #4A6FA5);
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s ease;

    &:hover {
      opacity: 0.85;
    }
  }
  ```

- [ ] **Step 2: Create `src/app/buyer/onboarding/page.tsx`**

  ```tsx
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
  ```

- [ ] **Step 3: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 4: Manual smoke test**

  ```bash
  npm run dev
  ```

  Navigate to `/buyer/onboarding` while logged in as a buyer with no existing profile. Verify:

  - Step 1 loads with the organization name input. "Next →" is disabled until the field has ≥ 2 characters.
  - Step 2 shows four number inputs in two rows. "Next →" disabled until all four are filled and min ≤ max for both pairs.
  - Step 3 shows the 50-state checkbox grid. Clicking a state highlights it. "Next →" disabled until at least 1 selected.
  - Step 4 shows business type and work type radio buttons plus employee min/max inputs. "Next →" disabled until both radios are selected and employee range is valid.
  - Step 5 shows preferred software input and management preference radios. "Complete →" disabled until both filled.
  - Clicking "Complete →" shows loading state then advances to step 6.
  - Step 6 shows the "Your Buy Box is set!" confirmation with all values correctly formatted.
  - "Go to dashboard →" navigates to `/inicio`.
  - Check Supabase Studio → `buyers` table → confirm the row was created with correct values (revenue and EBITDA stored as full USD amounts, not display units).
  - "← Back" on steps 2–5 returns to the previous step.

  Guard test:
  - Visit `/buyer/onboarding` while already having a buyer profile → should redirect to `/inicio` immediately.

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/buyer/onboarding/
  git commit -m "feat: add buyer onboarding wizard with Buy Box steps and confirmation"
  ```

---

### Task 3: Update `/onboarding/page.tsx` — redirect buyers to `/buyer/onboarding`

**Files:**
- Modify: `src/app/onboarding/page.tsx`

**Interfaces:**
- Consumes: existing `selectedRole` state, existing `router`, existing `refreshRole` — all already present in the file.
- Produces: after step 2 completes, buyers go to `/buyer/onboarding` and sellers go to `/seller/onboarding`.

- [ ] **Step 1: Update the redirect in `handleUsernameSubmit`**

  Open `src/app/onboarding/page.tsx`. Locate this block inside `handleUsernameSubmit`:

  ```tsx
  if (selectedRole === "seller") {
    router.push("/seller/onboarding");
  } else {
    router.push("/inicio");
  }
  ```

  Replace with:

  ```tsx
  if (selectedRole === "seller") {
    router.push("/seller/onboarding");
  } else {
    router.push("/buyer/onboarding");
  }
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3: End-to-end flow test**

  ```bash
  npm run dev
  ```

  Register a new account:
  - Choose "BUY" → set username → expect redirect to `/buyer/onboarding`.
  - Verify the wizard loads at step 1.

  Register a second account:
  - Choose "SELL" → set username → expect redirect to `/seller/onboarding`.
  - Verify the seller wizard loads (existing behavior unchanged).

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/onboarding/page.tsx
  git commit -m "feat: redirect buyers to /buyer/onboarding after onboarding step 2"
  ```

---

## Verification Checklist

After all tasks are complete, verify the full buyer flow end-to-end:

- [ ] New buyer registration completes `/onboarding` and lands on `/buyer/onboarding`.
- [ ] Step 1: organization name — min 2 chars enforced, max 100.
- [ ] Step 2: all four financial fields required; min ≤ max enforced for both revenue and EBITDA pairs.
- [ ] Step 3: 50 states displayed; at least 1 required to advance.
- [ ] Step 4: business type and work type radio required; employee range valid.
- [ ] Step 5: preferred software and management preference both required; submit calls Supabase.
- [ ] Step 6: "Your Buy Box is set!" — all values displayed; revenue in millions, EBITDA in hundred thousands.
- [ ] "Go to dashboard →" navigates to `/inicio`.
- [ ] A buyer who already has a profile is redirected to `/inicio` immediately on visiting `/buyer/onboarding`.
- [ ] New seller registration still redirects to `/seller/onboarding` after `/onboarding` (no regression).
- [ ] `npx tsc --noEmit` reports 0 errors.
- [ ] Supabase `buyers` table row created with `revenue_min/max` and `ebitda_min/max` as full USD values.
