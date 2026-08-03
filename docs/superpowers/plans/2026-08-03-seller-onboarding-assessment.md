# Seller Onboarding — Investment-Grade Readiness Assessment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 10-step seller onboarding wizard at `/seller/onboarding` — 8 category assessment steps, 1 business data form, 1 results view — activating immediately after the existing `/onboarding` role+username flow for sellers.

**Architecture:** The existing `/onboarding/page.tsx` gets a single bifurcation: after username saved, sellers redirect to `/seller/onboarding` instead of `/`. The new route is a client-side wizard holding all answers in local state. Business data is saved to Supabase only on step 9 submit. Scores are calculated on the frontend for a one-time printable results view on step 10. The questionnaire has 25 questions across 8 categories (Finance & Accounting has 4 questions; all others have 3). Scoring handles variable question count per category.

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

### Task 1: Add `phone` and `website` to `Seller` type + Supabase schema

**Files:**
- Modify: `src/app/lib/types.ts`

**Interfaces:**
- Produces: `Seller` interface now includes `phone: string | null` and `website: string | null`. All later tasks rely on this updated type.

- [ ] **Step 1: Add the two new fields to the `Seller` interface**

  Open `src/app/lib/types.ts`. In the `Seller` interface, add after the `status` line:

  ```ts
  export interface Seller {
    id: string;
    profile_id: string;
    company_name: string;
    state: string | null;
    annual_revenue: number | null;
    ebitda: number | null;
    ebitda_margin: number | null;
    employee_count: number | null;
    years_in_business: number | null;
    business_type: BusinessType | null;
    work_type: WorkType | null;
    software: string | null;
    management_type: ManagementType | null;
    asking_price: number | null;
    status: SellerStatus;
    phone: string | null;
    website: string | null;
    created_at: string;
    updated_at: string;
  }
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors. The new nullable fields do not break any existing code because they are optional DB columns that Supabase returns as `null` when absent.

- [ ] **Step 3: Apply schema migration in Supabase Studio**

  Go to Supabase Studio → SQL Editor → run:

  ```sql
  ALTER TABLE sellers
    ADD COLUMN IF NOT EXISTS phone text,
    ADD COLUMN IF NOT EXISTS website text;
  ```

  Expected: success. Verify in Table Editor → `sellers` that both columns appear.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/lib/types.ts
  git commit -m "feat: add phone and website fields to Seller type"
  ```

---

### Task 2: Add `createSellerProfile` to `sellers.ts`

**Files:**
- Modify: `src/app/lib/supabase/sellers.ts`

**Interfaces:**
- Produces: `createSellerProfile(data: SellerProfileData): Promise<Seller>` — exported named function. Task 7 calls this on step 9 submit.

- [ ] **Step 1: Add the `SellerProfileData` interface and `createSellerProfile` function**

  Open `src/app/lib/supabase/sellers.ts`. After the existing `deleteSeller` function, append:

  ```ts
  export interface SellerProfileData {
    company_name: string;
    annual_revenue: number;
    ebitda: number;
    phone: string | null;
    website: string | null;
  }

  export const createSellerProfile = async (data: SellerProfileData): Promise<Seller> => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('No authenticated user');

    const { data: seller, error } = await supabase
      .from('sellers')
      .insert({
        profile_id: user.id,
        company_name: data.company_name,
        annual_revenue: data.annual_revenue,
        ebitda: data.ebitda,
        phone: data.phone,
        website: data.website,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return seller as Seller;
  };
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/lib/supabase/sellers.ts
  git commit -m "feat: add createSellerProfile function for seller onboarding"
  ```

---

### Task 3: Create `sellerAssessment.ts` — static questionnaire data

**Files:**
- Create: `src/app/lib/data/sellerAssessment.ts`

**Interfaces:**
- Produces:
  - `AssessmentOption { label: string; score: number }` — exported interface
  - `AssessmentQuestion { text: string; options: AssessmentOption[] }` — exported interface
  - `AssessmentCategory { name: string; questions: AssessmentQuestion[] }` — exported interface
  - `ASSESSMENT_CATEGORIES: AssessmentCategory[]` — exported const, length 8

  Tasks 4, 5, 6, and 7 all import from this file.

- [ ] **Step 1: Create `src/app/lib/data/sellerAssessment.ts`**

  ```ts
  export interface AssessmentOption {
    label: string;
    score: number;
  }

  export interface AssessmentQuestion {
    text: string;
    options: AssessmentOption[];
  }

  export interface AssessmentCategory {
    name: string;
    questions: AssessmentQuestion[];
  }

  export const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
    {
      name: 'Brand, Reputation & Customer Mix',
      questions: [
        {
          text: "How strong is your company's reputation in your local market, and how clearly differentiated are you from competitors?",
          options: [
            { label: 'Weak', score: 1 },
            { label: 'Below average', score: 2 },
            { label: 'Average', score: 3 },
            { label: 'Strong & consistent', score: 4 },
            { label: 'Best-in-class', score: 5 },
          ],
        },
        {
          text: 'How dependent is your business on a small number of customers or referral sources?',
          options: [
            { label: 'High dependence', score: 1 },
            { label: 'Some dependence', score: 2 },
            { label: 'Balanced', score: 3 },
            { label: 'Low dependence', score: 4 },
            { label: 'No meaningful concentration', score: 5 },
          ],
        },
        {
          text: 'How dependent is your revenue on storms/hail, and how resilient would the business be if that segment/channel declined?',
          options: [
            { label: 'High dependence', score: 1 },
            { label: 'Some dependence', score: 2 },
            { label: 'Balanced', score: 3 },
            { label: 'Low dependence', score: 4 },
            { label: 'Not storm-driven / highly resilient', score: 5 },
          ],
        },
      ],
    },
    {
      name: 'Marketing & Lead Generation',
      questions: [
        {
          text: 'How consistent are your inbound leads month over month?',
          options: [
            { label: 'Highly inconsistent', score: 1 },
            { label: 'Somewhat inconsistent', score: 2 },
            { label: 'Average consistency', score: 3 },
            { label: 'High consistency', score: 4 },
            { label: 'Very consistent', score: 5 },
          ],
        },
        {
          text: 'How many distinct lead sources bring you regular business?',
          options: [
            { label: 'No defined sources', score: 1 },
            { label: '1 source', score: 2 },
            { label: '2 sources', score: 3 },
            { label: '3 sources', score: 4 },
            { label: '4+ sources', score: 5 },
          ],
        },
        {
          text: 'Do you have a documented marketing plan, track ROI by channel, and run a structured lead follow-up process?',
          options: [
            { label: 'None of the above', score: 1 },
            { label: 'One of three', score: 2 },
            { label: 'Two of three', score: 3 },
            { label: 'All three (inconsistent)', score: 4 },
            { label: 'All three (consistent)', score: 5 },
          ],
        },
      ],
    },
    {
      name: 'Sales & Estimating',
      questions: [
        {
          text: 'Do you track estimate-to-signed-job conversion rate and review it regularly?',
          options: [
            { label: 'Not tracked', score: 1 },
            { label: 'Tracked ad hoc', score: 2 },
            { label: 'Tracked sometimes', score: 3 },
            { label: 'Tracked monthly', score: 4 },
            { label: 'Tracked weekly', score: 5 },
          ],
        },
        {
          text: 'How standardized is your estimating/proposal process and how organized is your sales pipeline (stages, status, follow-ups)?',
          options: [
            { label: 'Not standardized', score: 1 },
            { label: 'Some standardization', score: 2 },
            { label: 'Mostly standardized', score: 3 },
            { label: 'Standardized & followed', score: 4 },
            { label: 'Fully standardized and audited', score: 5 },
          ],
        },
        {
          text: 'How often do projects meet or beat estimated profit margin, and how confident/trained is the sales team in closing?',
          options: [
            { label: 'Rarely', score: 1 },
            { label: 'Sometimes', score: 2 },
            { label: '50/50', score: 3 },
            { label: 'Often', score: 4 },
            { label: 'Almost always', score: 5 },
          ],
        },
      ],
    },
    {
      name: 'Operations & Production',
      questions: [
        {
          text: 'How predictable and organized is your job scheduling?',
          options: [
            { label: 'Chaotic', score: 1 },
            { label: 'Reactive', score: 2 },
            { label: 'Somewhat planned', score: 3 },
            { label: 'Predictable', score: 4 },
            { label: 'Strong & consistent', score: 5 },
          ],
        },
        {
          text: 'How consistently are jobs inspected for quality before completion, and how dependable/accountable are your crews or subcontractors?',
          options: [
            { label: 'Weak', score: 1 },
            { label: 'Below average', score: 2 },
            { label: 'Average', score: 3 },
            { label: 'Strong and consistent', score: 4 },
            { label: 'Best-in-class', score: 5 },
          ],
        },
        {
          text: 'How clear is communication between office, sales, and crews, and how soon after a project ends do you review actual vs estimated costs?',
          options: [
            { label: 'Weak', score: 1 },
            { label: 'Below average', score: 2 },
            { label: 'Average', score: 3 },
            { label: 'Strong and consistent', score: 4 },
            { label: 'Best-in-class', score: 5 },
          ],
        },
      ],
    },
    {
      name: 'People & Culture',
      questions: [
        {
          text: 'How steady is your core team, and how clearly does each team member know their role and goals?',
          options: [
            { label: 'Weak', score: 1 },
            { label: 'Below average', score: 2 },
            { label: 'Average', score: 3 },
            { label: 'Strong & consistent', score: 4 },
            { label: 'Best-in-class', score: 5 },
          ],
        },
        {
          text: "How prepared are others to step up if you're unavailable for a few weeks?",
          options: [
            { label: 'Not prepared', score: 1 },
            { label: 'Slightly prepared', score: 2 },
            { label: 'Somewhat prepared', score: 3 },
            { label: 'Mostly prepared', score: 4 },
            { label: 'Fully prepared', score: 5 },
          ],
        },
        {
          text: 'How structured is your process for hiring and training new people?',
          options: [
            { label: 'No process', score: 1 },
            { label: 'Informal', score: 2 },
            { label: 'Some structure', score: 3 },
            { label: 'Structured', score: 4 },
            { label: 'Best-in-class', score: 5 },
          ],
        },
      ],
    },
    {
      name: 'Technology & Systems',
      questions: [
        {
          text: 'How well do your core tools (CRM, accounting, project management) connect and share data?',
          options: [
            { label: 'Weak', score: 1 },
            { label: 'Below average', score: 2 },
            { label: 'Average', score: 3 },
            { label: 'Strong & consistent', score: 4 },
            { label: 'Best-in-class', score: 5 },
          ],
        },
        {
          text: 'How consistently does your team use the systems you\'ve invested in, and how confident are you that your data is accurate and up to date?',
          options: [
            { label: 'Weak', score: 1 },
            { label: 'Below average', score: 2 },
            { label: 'Average', score: 3 },
            { label: 'Strong & consistent', score: 4 },
            { label: 'Best-in-class', score: 5 },
          ],
        },
        {
          text: 'How much of your routine work is automated, and how often do you review/upgrade your tools or processes?',
          options: [
            { label: 'Not automated / never reviewed', score: 1 },
            { label: 'Minimal / rarely', score: 2 },
            { label: 'Some / sometimes', score: 3 },
            { label: 'Mostly / regularly', score: 4 },
            { label: 'Highly / continuous improvement', score: 5 },
          ],
        },
      ],
    },
    {
      name: 'Owner Dependence',
      questions: [
        {
          text: 'If you stepped away for 30–60 days, how well would the business continue to operate?',
          options: [
            { label: 'Would stall', score: 1 },
            { label: 'Barely operate', score: 2 },
            { label: 'Key employees would step up', score: 3 },
            { label: 'Mostly operate', score: 4 },
            { label: 'Fully operate without issues', score: 5 },
          ],
        },
        {
          text: 'How involved are you in day-to-day decisions, and how many key customer/supplier/partner relationships depend primarily on you?',
          options: [
            { label: 'Very involved / almost all relationships', score: 1 },
            { label: 'Very involved / many relationships', score: 2 },
            { label: 'Mixed', score: 3 },
            { label: 'Limited / few relationships', score: 4 },
            { label: 'Low / institutionalized', score: 5 },
          ],
        },
        {
          text: 'How prepared is your leadership team to run the business without you on a daily basis?',
          options: [
            { label: 'Not prepared', score: 1 },
            { label: 'Slightly prepared', score: 2 },
            { label: 'Somewhat prepared', score: 3 },
            { label: 'Mostly prepared', score: 4 },
            { label: 'Fully prepared', score: 5 },
          ],
        },
      ],
    },
    {
      name: 'Finance & Accounting',
      questions: [
        {
          text: 'How up to date and decision-ready are your financial statements (P&L, balance sheet, cash flow)?',
          options: [
            { label: 'Tax-time only', score: 1 },
            { label: 'Quarterly', score: 2 },
            { label: 'Monthly (late)', score: 3 },
            { label: 'Monthly (on time)', score: 4 },
            { label: 'Close ≤15 days + reviewed', score: 5 },
          ],
        },
        {
          text: 'How well do you manage cash flow (collections, reserves, forecasting)?',
          options: [
            { label: 'Weak', score: 1 },
            { label: 'Below average', score: 2 },
            { label: 'Average', score: 3 },
            { label: 'Strong & consistent', score: 4 },
            { label: 'Best-in-class', score: 5 },
          ],
        },
        {
          text: 'Are you using accrual-based accounting and job-level tracking, and how often do you review key financial metrics with leadership?',
          options: [
            { label: 'No / never', score: 1 },
            { label: 'Sometimes / rarely', score: 2 },
            { label: 'Sometimes / sometimes', score: 3 },
            { label: 'Mostly / monthly', score: 4 },
            { label: 'Yes / weekly+', score: 5 },
          ],
        },
        {
          text: 'How often do you review key financial metrics with leadership?',
          options: [
            { label: "They don't need to know metrics", score: 1 },
            { label: 'When things go wrong', score: 2 },
            { label: 'Sometimes', score: 3 },
            { label: 'Every month', score: 4 },
            { label: 'Best-in-class', score: 5 },
          ],
        },
      ],
    },
  ];
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/lib/data/sellerAssessment.ts
  git commit -m "feat: add seller assessment static questionnaire data"
  ```

---

### Task 4: Create `scoring.ts` — pure score calculation functions

**Files:**
- Create: `src/app/lib/utils/scoring.ts`

**Interfaces:**
- Consumes: `ASSESSMENT_CATEGORIES` from `src/app/lib/data/sellerAssessment.ts`
- Produces:
  - `getStartIndex(categoryIndex: number): number` — exported
  - `calcCategoryScore(categoryIndex: number, answers: Record<number, number>): number` — exported, returns 0–100
  - `calcOverallScore(answers: Record<number, number>): number` — exported, returns 0–100
  - `getScoreLabel(score: number): string` — exported
  - `getStarRating(score: number): number` — exported, returns 1–5

  Tasks 6 (AssessmentResults) imports all five of these.

- [ ] **Step 1: Create `src/app/lib/utils/scoring.ts`**

  ```ts
  import { ASSESSMENT_CATEGORIES } from '../data/sellerAssessment';

  export function getStartIndex(categoryIndex: number): number {
    return ASSESSMENT_CATEGORIES.slice(0, categoryIndex).reduce(
      (sum, cat) => sum + cat.questions.length,
      0
    );
  }

  export function calcCategoryScore(
    categoryIndex: number,
    answers: Record<number, number>
  ): number {
    const category = ASSESSMENT_CATEGORIES[categoryIndex];
    const startIndex = getStartIndex(categoryIndex);
    const n = category.questions.length;
    let total = 0;
    for (let i = 0; i < n; i++) {
      total += answers[startIndex + i] ?? 0;
    }
    return (total / (n * 5)) * 100;
  }

  export function calcOverallScore(answers: Record<number, number>): number {
    const scores = ASSESSMENT_CATEGORIES.map((_, i) => calcCategoryScore(i, answers));
    return scores.reduce((sum, s) => sum + s, 0) / scores.length;
  }

  export function getScoreLabel(score: number): string {
    if (score >= 85) return 'Investment-Grade';
    if (score >= 70) return 'Strong Business with Targeted Upgrade Areas';
    if (score >= 55) return 'Optimization Opportunity';
    if (score >= 40) return 'Development Stage';
    return 'Not Ready';
  }

  export function getStarRating(score: number): number {
    if (score >= 85) return 5;
    if (score >= 70) return 4;
    if (score >= 55) return 3;
    if (score >= 40) return 2;
    return 1;
  }
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/lib/utils/scoring.ts
  git commit -m "feat: add scoring utility functions for seller assessment"
  ```

---

### Task 5: Create `AssessmentStep` component

**Files:**
- Create: `src/shared/components/assessmentStep/assessmentStep.tsx`
- Create: `src/shared/components/assessmentStep/assessmentStep.scss`

**Interfaces:**
- Consumes:
  - `ASSESSMENT_CATEGORIES` from `src/app/lib/data/sellerAssessment.ts`
  - `getStartIndex` from `src/app/lib/utils/scoring.ts`
- Produces: `<AssessmentStep categoryIndex answers onAnswer onNext onBack? />` — default export

  ```ts
  interface AssessmentStepProps {
    categoryIndex: number;           // 0–7
    answers: Record<number, number>; // global question index → score 1–5
    onAnswer: (questionIndex: number, score: number) => void;
    onNext: () => void;
    onBack?: () => void;
  }
  ```

  Task 7 (page.tsx) renders this for steps 1–8.

- [ ] **Step 1: Create `assessmentStep.scss`**

  Create `src/shared/components/assessmentStep/assessmentStep.scss`:

  ```scss
  .assessment-step {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    max-width: 720px;
    margin: 0 auto;
    padding: 2rem 1rem;
    min-height: 100dvh;
  }

  .assessment-progress {
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

  .assessment-category-title {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .assessment-questions {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .assessment-question {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    &__text {
      font-size: 0.95rem;
      line-height: 1.5;
      opacity: 0.9;
    }

    &__options {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  }

  .assessment-option {
    padding: 0.4rem 0.9rem;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: transparent;
    color: var(--estora-white, #fafafa);
    font-size: 0.8rem;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;

    &:hover:not(.assessment-option--selected) {
      border-color: rgba(255, 255, 255, 0.4);
    }

    &--selected {
      border-color: var(--estora-primary, #4A6FA5);
      background: rgba(74, 111, 165, 0.2);
      font-weight: 600;
    }
  }

  .assessment-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    margin-top: auto;
  }

  .assessment-btn {
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
  ```

- [ ] **Step 2: Create `assessmentStep.tsx`**

  Create `src/shared/components/assessmentStep/assessmentStep.tsx`:

  ```tsx
  "use client";

  import { ASSESSMENT_CATEGORIES } from '../../../app/lib/data/sellerAssessment';
  import { getStartIndex } from '../../../app/lib/utils/scoring';
  import "./assessmentStep.scss";

  interface AssessmentStepProps {
    categoryIndex: number;
    answers: Record<number, number>;
    onAnswer: (questionIndex: number, score: number) => void;
    onNext: () => void;
    onBack?: () => void;
  }

  export default function AssessmentStep({
    categoryIndex,
    answers,
    onAnswer,
    onNext,
    onBack,
  }: AssessmentStepProps) {
    const category = ASSESSMENT_CATEGORIES[categoryIndex];
    const startIndex = getStartIndex(categoryIndex);
    const totalCategories = ASSESSMENT_CATEGORIES.length;

    const allAnswered = category.questions.every(
      (_, i) => answers[startIndex + i] !== undefined
    );

    return (
      <div className="assessment-step">
        <div className="assessment-progress">
          <span className="assessment-progress__label">
            Step {categoryIndex + 1} of {totalCategories}
          </span>
          <div className="assessment-progress__bar">
            <div
              className="assessment-progress__fill"
              style={{ width: `${((categoryIndex + 1) / totalCategories) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="assessment-category-title">{category.name}</h2>

        <div className="assessment-questions">
          {category.questions.map((question, qi) => {
            const globalIndex = startIndex + qi;
            const selectedScore = answers[globalIndex];

            return (
              <div key={qi} className="assessment-question">
                <p className="assessment-question__text">{question.text}</p>
                <div className="assessment-question__options">
                  {question.options.map((option) => (
                    <button
                      key={option.score}
                      className={`assessment-option${selectedScore === option.score ? ' assessment-option--selected' : ''}`}
                      onClick={() => onAnswer(globalIndex, option.score)}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="assessment-nav">
          {onBack ? (
            <button className="assessment-btn" onClick={onBack} type="button">
              ← Back
            </button>
          ) : (
            <span />
          )}
          <button
            className="assessment-btn assessment-btn--primary"
            onClick={onNext}
            disabled={!allAnswered}
            type="button"
          >
            {categoryIndex === totalCategories - 1 ? 'Continue →' : 'Next →'}
          </button>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/shared/components/assessmentStep/
  git commit -m "feat: add AssessmentStep wizard component"
  ```

---

### Task 6: Create `AssessmentResults` component

**Files:**
- Create: `src/shared/components/assessmentResults/assessmentResults.tsx`
- Create: `src/shared/components/assessmentResults/assessmentResults.scss`

**Interfaces:**
- Consumes:
  - `ASSESSMENT_CATEGORIES` from `src/app/lib/data/sellerAssessment.ts`
  - `calcCategoryScore`, `calcOverallScore`, `getScoreLabel`, `getStarRating` from `src/app/lib/utils/scoring.ts`
- Produces: `<AssessmentResults answers businessName onFinish />` — default export

  ```ts
  interface AssessmentResultsProps {
    answers: Record<number, number>;
    businessName: string;
    onFinish: () => void;
  }
  ```

  Task 7 (page.tsx) renders this for step 10.

- [ ] **Step 1: Create `assessmentResults.scss`**

  Create `src/shared/components/assessmentResults/assessmentResults.scss`:

  ```scss
  .assessment-results {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem 4rem;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }

  .results-hero {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;

    &__eyebrow {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.5;
    }

    &__score {
      font-size: 5rem;
      font-weight: 800;
      line-height: 1;
      color: var(--estora-white, #fafafa);
    }

    &__label {
      font-size: 1.1rem;
      font-weight: 600;
      opacity: 0.85;
      max-width: 400px;
      text-align: center;
    }
  }

  .results-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;

    @media (min-width: 640px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  .results-category-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &__name {
      font-size: 0.8rem;
      font-weight: 600;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    &__score {
      font-size: 1.75rem;
      font-weight: 800;
    }

    &__stars {
      font-size: 0.9rem;
      letter-spacing: 0.05em;
    }

    &__label {
      font-size: 0.75rem;
      opacity: 0.6;
    }
  }

  .results-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }

  .results-btn {
    padding: 0.65rem 1.5rem;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: opacity 0.15s ease;

    &--print {
      border: 1px solid rgba(255, 255, 255, 0.3);
      background: transparent;
      color: var(--estora-white, #fafafa);
    }

    &--finish {
      border: none;
      background: var(--estora-primary, #4A6FA5);
      color: #fff;
      font-weight: 600;
    }

    &:hover {
      opacity: 0.8;
    }
  }

  @media print {
    .results-actions {
      display: none;
    }
  }
  ```

- [ ] **Step 2: Create `assessmentResults.tsx`**

  Create `src/shared/components/assessmentResults/assessmentResults.tsx`:

  ```tsx
  "use client";

  import { ASSESSMENT_CATEGORIES } from '../../../app/lib/data/sellerAssessment';
  import {
    calcCategoryScore,
    calcOverallScore,
    getScoreLabel,
    getStarRating,
  } from '../../../app/lib/utils/scoring';
  import "./assessmentResults.scss";

  interface AssessmentResultsProps {
    answers: Record<number, number>;
    businessName: string;
    onFinish: () => void;
  }

  function Stars({ count }: { count: number }) {
    return (
      <span className="results-category-card__stars">
        {'★'.repeat(count)}{'☆'.repeat(5 - count)}
      </span>
    );
  }

  export default function AssessmentResults({
    answers,
    businessName,
    onFinish,
  }: AssessmentResultsProps) {
    const overall = calcOverallScore(answers);
    const label = getScoreLabel(overall);

    const categoryResults = ASSESSMENT_CATEGORIES.map((cat, i) => ({
      name: cat.name,
      score: calcCategoryScore(i, answers),
    }));

    return (
      <div className="assessment-results">
        <div className="results-hero">
          <span className="results-hero__eyebrow">
            Investment-Grade Readiness Assessment
          </span>
          {businessName && (
            <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>{businessName}</p>
          )}
          <div className="results-hero__score">{Math.round(overall)}%</div>
          <p className="results-hero__label">{label}</p>
        </div>

        <div className="results-grid">
          {categoryResults.map((cat) => {
            const stars = getStarRating(cat.score);
            return (
              <div key={cat.name} className="results-category-card">
                <span className="results-category-card__name">{cat.name}</span>
                <span className="results-category-card__score">
                  {Math.round(cat.score)}%
                </span>
                <Stars count={stars} />
                <span className="results-category-card__label">
                  {getScoreLabel(cat.score)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="results-actions">
          <button
            className="results-btn results-btn--print"
            onClick={() => window.print()}
            type="button"
          >
            Print results
          </button>
          <button
            className="results-btn results-btn--finish"
            onClick={onFinish}
            type="button"
          >
            Go to dashboard →
          </button>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/shared/components/assessmentResults/
  git commit -m "feat: add AssessmentResults component with score display and print"
  ```

---

### Task 7: Create `/seller/onboarding/page.tsx` — wizard orchestrator

**Files:**
- Create: `src/app/seller/onboarding/page.tsx`
- Create: `src/app/seller/onboarding/onboarding.scss`

**Interfaces:**
- Consumes:
  - `AssessmentStep` from `src/shared/components/assessmentStep/assessmentStep.tsx` (Task 5)
  - `AssessmentResults` from `src/shared/components/assessmentResults/assessmentResults.tsx` (Task 6)
  - `createSellerProfile, SellerProfileData` from `src/app/lib/supabase/sellers.ts` (Task 2)
  - `ASSESSMENT_CATEGORIES` from `src/app/lib/data/sellerAssessment.ts` (Task 3)
  - `ProtectedRoute` from `src/app/utils/protectedRoute.tsx`
  - `useAuth` from `src/app/utils/isAuth.tsx`
  - `getOwnSeller` from `src/app/lib/supabase/sellers.ts`

- [ ] **Step 1: Create `onboarding.scss`**

  Create `src/app/seller/onboarding/onboarding.scss`:

  ```scss
  .seller-onboarding-form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    max-width: 480px;
    margin: 0 auto;
    padding: 2rem 1rem;
    min-height: 100dvh;

    h2 {
      font-size: 1.5rem;
      font-weight: 700;
    }

    p {
      opacity: 0.6;
      font-size: 0.9rem;
    }
  }

  .seller-onboarding-fields {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .seller-onboarding-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

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

  .seller-onboarding-error {
    color: #ef4444;
    font-size: 0.85rem;
  }

  .seller-onboarding-submit {
    padding: 0.7rem 1.5rem;
    border-radius: 8px;
    border: none;
    background: var(--estora-primary, #4A6FA5);
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s ease;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  ```

- [ ] **Step 2: Create `page.tsx`**

  Create `src/app/seller/onboarding/page.tsx`:

  ```tsx
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

    // steps 1–8: category wizard (categoryIndex = step - 1)
    // step 9: business data form
    // step 10: results view
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

    // Guard: redirect if seller profile already exists
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
        setStep(10);
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

    // Steps 1–8: category wizard
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

    // Step 9: business data form
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

    // Step 10: results view
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

  Navigate to `/seller/onboarding` while logged in as a seller with no existing profile. Verify:
  - Category 1 loads with 3 questions and 5 option buttons each.
  - `Next →` is disabled until all questions in the step are answered.
  - `Back` is absent on step 1, present on steps 2–8.
  - After step 8, the business data form appears.
  - After submitting the form, the results view appears with a score percentage and 8 category cards.
  - `Print results` calls `window.print()`.
  - `Go to dashboard →` navigates to `/inicio`.

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/seller/onboarding/
  git commit -m "feat: add /seller/onboarding wizard with assessment, data form, and results"
  ```

---

### Task 8: Update `/onboarding/page.tsx` — bifurcate post-username redirect

**Files:**
- Modify: `src/app/onboarding/page.tsx`

**Interfaces:**
- Consumes: existing `useAuth`, `updateProfile`, `useRouter` already in the file.
- Produces: after step 2 completes, sellers go to `/seller/onboarding` and buyers go to `/inicio`.

- [ ] **Step 1: Add `selectedRole` state and update `handleRoleSelect`**

  Open `src/app/onboarding/page.tsx`. After the existing state declarations, add one new state variable:

  Replace:
  ```tsx
  const [step, setStep] = useState<1 | 2>(1);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState("");
  ```

  With:
  ```tsx
  const [step, setStep] = useState<1 | 2>(1);
  const [panelLoading, setPanelLoading] = useState(false);
  const [panelError, setPanelError] = useState("");
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller" | null>(null);
  ```

  Then update `handleRoleSelect` to capture the selected role:

  Replace:
  ```tsx
  const handleRoleSelect = async (chosen: "buyer" | "seller") => {
    setPanelLoading(true);
    try {
      await updateProfile({ role: chosen });
      setStep(2);
    } catch (err) {
      console.error("Error setting role:", err);
      setPanelError("Error when setting role. Please try again.");
    } finally {
      setPanelLoading(false);
    }
  };
  ```

  With:
  ```tsx
  const handleRoleSelect = async (chosen: "buyer" | "seller") => {
    setPanelLoading(true);
    try {
      await updateProfile({ role: chosen });
      setSelectedRole(chosen);
      setStep(2);
    } catch (err) {
      console.error("Error setting role:", err);
      setPanelError("Error when setting role. Please try again.");
    } finally {
      setPanelLoading(false);
    }
  };
  ```

- [ ] **Step 2: Update `handleUsernameSubmit` to bifurcate the redirect**

  Replace:
  ```tsx
  await updateProfile({ username });
  await refreshRole();
  router.push("/");
  ```

  With:
  ```tsx
  await updateProfile({ username });
  await refreshRole();
  if (selectedRole === "seller") {
    router.push("/seller/onboarding");
  } else {
    router.push("/inicio");
  }
  ```

- [ ] **Step 3: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 4: End-to-end flow test**

  ```bash
  npm run dev
  ```

  Register a new account. In `/onboarding`:
  - Choose "Sell" → expect step 2 (username) to appear.
  - Set a username → expect redirect to `/seller/onboarding`.
  - Verify the wizard loads correctly.

  Register a second account. Choose "Buy" → set username → expect redirect to `/inicio`.

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/onboarding/page.tsx
  git commit -m "feat: redirect sellers to /seller/onboarding after onboarding step 2"
  ```

---

## Verification Checklist

After all tasks are complete, verify the full seller flow end-to-end:

- [ ] New seller registration completes `/onboarding` and lands on `/seller/onboarding`.
- [ ] Steps 1–8 each show correct category name, 3–4 questions, 5 option buttons.
- [ ] `Next →` is disabled until all questions on the current step are answered.
- [ ] Progress bar advances correctly each step.
- [ ] Step 9 shows the business data form with required field validation.
- [ ] Submitting step 9 creates a row in `sellers` table with correct `annual_revenue` and `ebitda` values (full USD, not display units).
- [ ] Step 10 shows overall score %, 8 category cards each with score % + star rating.
- [ ] `Print results` triggers browser print dialog.
- [ ] `Go to dashboard →` navigates to `/inicio`.
- [ ] A seller who already has a profile is redirected to `/inicio` immediately on visiting `/seller/onboarding`.
- [ ] New buyer registration still redirects to `/inicio` after `/onboarding`.
- [ ] `npx tsc --noEmit` reports 0 errors.
