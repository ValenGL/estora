# Seller Onboarding — Investment-Grade Readiness Assessment

**Date:** 2026-08-03
**Status:** Approved
**Sprint:** 2 — Seller Onboarding

---

## Goal

Extend the post-registration onboarding flow so that sellers, immediately after setting their role and username, complete a 24-question Investment-Grade Readiness Assessment. The assessment calculates scores per category and overall, collects basic business data, and presents a printable results view — all ephemeral (no scores persisted). Business data is saved to the `sellers` table.

---

## 1. Flow & Routing

```
/registro → /onboarding (step 1: role, step 2: username)
  └─ role === 'seller' → /seller/onboarding (wizard + data + results)
       └─ on finish → /inicio
  └─ role === 'buyer'  → /inicio
```

**Change to `/onboarding/page.tsx`:** After step 2 (username saved and `refreshRole()` called), the current redirect to `/inicio` becomes a bifurcation:
- `role === 'seller'` → `router.push('/seller/onboarding')`
- `role === 'buyer'` → `router.push('/inicio')`

**New route `/seller/onboarding`:** Wrapped with `ProtectedRoute`. The user already has `role = 'seller'` at this point so the guard passes. Contains 10 steps total:

- Steps 1–8: Assessment wizard, one category per step.
- Step 9: Business data form — persisted to `sellers` table on submit.
- Step 10: Results view — calculated on frontend, printable, not stored. Closes to `/inicio`.

---

## 2. Data & State

**Local wizard state (not persisted until step 9):**
```ts
answers: Record<number, number>  // global question index (0–23) → score 1–5
step: number                     // 1–10
```

State lives in `page.tsx` and is passed down as props. No Supabase calls until step 9 submit.

**Score calculation (frontend only, ephemeral):**
```ts
// Category score: average of 3 questions as percentage
categoryScore = (q1 + q2 + q3) / 15 * 100

// Overall score: average of 8 category scores
overallScore = sum(8 categoryScores) / 8
```

Calculated inside `assessmentResults.tsx` via pure functions from `scoring.ts`. Not written to any table.

**Step 9 persistence:** A single `createSellerProfile(data)` call in `src/app/lib/supabase/sellers.ts`. Inserts one row into `sellers` with:
- `profile_id` — from authenticated user
- `company_name`, `annual_revenue`, `ebitda`, `phone`, `website`
- `status: 'active'`

**Unit conversion for financial fields:** The form labels match the reference (`in millions` / `in hundred thousands`) but `sellers` stores full USD integers. Conversion applied before insert:
- `annual_revenue = parseFloat(input) * 1_000_000`
- `ebitda = parseFloat(input) * 100_000`

**Database changes:**
- `sellers` table: add `phone text` (nullable) and `website text` (nullable) columns.
- `src/app/lib/types.ts`: add `phone: string | null` and `website: string | null` to the `Seller` interface.

---

## 3. Assessment Content

**8 categories, 3 questions each, 24 questions total.** Each question has 5 ordered options scored 1–5 (option index + 1). Source of truth lives in `src/app/lib/data/sellerAssessment.ts` as a typed static array — no logic, content only.

Categories (in order):
1. Brand, Reputation & Customer Mix
2. Marketing & Lead Generation
3. Sales & Estimating
4. Operations & Production
5. People & Culture
6. Technology & Systems
7. Owner Dependence
8. Finance & Accounting

The full question text and option labels are transcribed from `seller-onboarding.txt` in the project root.

---

## 4. Components & File Structure

**New files:**
```
src/app/seller/onboarding/
  page.tsx              ← orchestrator: owns `step` and `answers`, ProtectedRoute wrapper
  onboarding.scss

src/app/lib/data/
  sellerAssessment.ts   ← static typed array: categories → questions → options

src/app/lib/utils/
  scoring.ts            ← pure functions: calcCategoryScore(), calcOverallScore()

src/shared/components/
  assessmentStep/
    assessmentStep.tsx  ← renders 1 category: title + 3 questions with visual radio cards
    assessmentStep.scss
  assessmentResults/
    assessmentResults.tsx  ← overall score + 8 category cards + print + go-to-home
    assessmentResults.scss
```

**Modified files:**
```
src/app/onboarding/page.tsx        ← post-username bifurcation: seller → /seller/onboarding
src/app/lib/types.ts               ← Seller: + phone, + website
src/app/lib/supabase/sellers.ts    ← new createSellerProfile() function
```

**Responsibility boundaries:**
- `page.tsx` — owns step and all answers. Advances steps, calls Supabase on step 9.
- `assessmentStep.tsx` — receives current category questions and current answers, emits selection callbacks. No internal state.
- `assessmentResults.tsx` — receives full answers array + submitted business data, calculates scores internally via `scoring.ts`, renders and offers `window.print()`.
- `sellerAssessment.ts` — single source of truth for categories/questions/options. Separated so content changes never touch logic.

---

## 5. UI & Design

Follows existing design system: SCSS + Tailwind, `estora-*` color tokens, `"use client"` directive, local `.scss` import pattern.

**Assessment step (steps 1–8):**
- Progress bar at top: `Step X of 8` label + visual fill bar (`bg-white/10` track, `bg-estora-primary` fill, proportional width).
- Category title in `h2`.
- 3 questions stacked vertically. Each question shows its text in `p` followed by 5 option cards arranged horizontally. Options are styled buttons (not native `<input type="radio">`). Selected option: `estora-primary` border + subtle background tint.
- Navigation: `Anterior` and `Siguiente` buttons at the bottom. `Siguiente` is disabled while any question in the current step is unanswered.

**Business data step (step 9):**
- Fields: Business Name, Phone, Website, Annual Revenue (in millions), EBITDA (in hundred thousands).
- Inputs styled to match existing register form.
- Submit button labeled `Ver mis resultados`. On click: calls `createSellerProfile()`, then advances to step 10.

**Results view (step 10):**
- Large centered overall score percentage with a label based on range (e.g. "Strong Business with Targeted Upgrade Areas").
- 8 category cards in `sm:grid-cols-2` grid, each showing: category name, score %, star rating (1–5), and a short result label.
- `Imprimir resultados` button → `window.print()`.
- `Ir al inicio` button → `router.push('/inicio')`.
- Dark theme, matches reference design in `seller-result-view.png`.

---

## 6. Score Labels

**Overall score → label mapping:**
- 0–39%: Not Ready
- 40–54%: Development Stage
- 55–69%: Optimization Opportunity
- 70–84%: Strong Business with Targeted Upgrade Areas
- 85–100%: Investment-Grade

**Star rating per category (out of 5):**
- < 40%: 1 star
- 40–54%: 2 stars
- 55–69%: 3 stars
- 70–84%: 4 stars
- ≥ 85%: 5 stars (Investment-Grade)

---

## 7. Out of Scope

- Storing assessment scores or answers in the database.
- Email delivery of results.
- Re-taking the assessment after completion.
- The "Free 45-minute consultation" CTA linking to a booking flow (show as static text only).
- Buyer onboarding (Sprint 3).
- Matching engine (Sprint 3).
