# Buyer Onboarding Wizard — Design Spec

**Date:** 2026-08-04
**Status:** Approved

---

## Context

Buyers currently land on `/inicio` immediately after the general `/onboarding` role+username flow. Their profile in the `buyers` table is never created during onboarding, leaving Buy Box criteria uncollected. This spec defines a 5-step wizard at `/buyer/onboarding` that captures all Buy Box fields and creates the buyer profile in Supabase before routing to the dashboard.

The wizard follows the same architectural pattern as `/seller/onboarding`.

---

## Goal

Collect all Buy Box criteria from new buyers and create their `buyers` table record before they access the marketplace.

---

## Architecture

**Route:** `/buyer/onboarding`

**Pattern:**
- Client component (`"use client"`) — all wizard state in local `useState`
- Single Supabase write on step 5 submit via `createBuyer(data)`
- Guard on mount: `getOwnBuyer()` — if record exists, redirect to `/inicio`
- Wrapped with `ProtectedRoute` HOC
- Redirected to from `/onboarding/page.tsx` for buyers (replacing current `/inicio` redirect)

**New files:**
- `src/app/buyer/onboarding/page.tsx` — wizard orchestrator
- `src/app/buyer/onboarding/onboarding.scss` — all wizard styles
- `src/app/lib/data/usStates.ts` — static array of 50 US states `{ code: string; label: string }[]`

**Modified files:**
- `src/app/onboarding/page.tsx` — change buyer post-username redirect from `/inicio` to `/buyer/onboarding`

**Data layer (no changes needed):**
- `createBuyer` and `getOwnBuyer` already exist in `src/app/lib/supabase/buyers.ts`
- `Buyer` type in `src/app/lib/types.ts` already includes all fields with correct union types (`BuyerBusinessType`, `BuyerWorkType`, `ManagementPreference`)

---

## Wizard Steps

### Step 1 — Organization

**Fields:** `organization_name` (text, required)

**Validation:** minimum 2 characters, maximum 100 characters. Next button disabled until valid.

---

### Step 2 — Financials

**Fields:**
- `revenue_min` / `revenue_max` — number inputs, label: "in millions USD". Stored as `value × 1_000_000`.
- `ebitda_min` / `ebitda_max` — number inputs, label: "in hundred thousands USD". Stored as `value × 100_000`.

**Validation:**
- All four fields required
- `revenue_min` ≤ `revenue_max`
- `ebitda_min` ≤ `ebitda_max`
- Values must be positive numbers

---

### Step 3 — Geography

**Field:** `target_states` (text[], minimum 1 state required)

**UI:** Checkbox grid of all 50 US states. Each item shows state abbreviation + full name (e.g., "TX — Texas"). Layout: 6 columns desktop, 4 tablet, 3 mobile. Selected states get a highlighted border + background using `estora-primary`.

**Data:** Static array exported from `src/app/lib/data/usStates.ts` ordered alphabetically by code.

---

### Step 4 — Business Profile

**Fields:**
- `business_type` — radio buttons: `residential` / `commercial` / `both` / `any`
- `work_type` — radio buttons: `retail` / `insurance` / `both` / `any`
- `employee_min` / `employee_max` — integer inputs (number of employees)

**Validation:**
- All fields required
- `employee_min` ≤ `employee_max`
- `employee_min` ≥ 0

---

### Step 5 — Operational Preferences

**Fields:**
- `preferred_software` — text input (free text, e.g. "Jobber", "AccuLynx")
- `management_preference` — radio buttons: `owner_operated` / `has_management_team` / `any`

**On submit:**
1. Call `createBuyer({ organization_name, revenue_min, revenue_max, ebitda_min, ebitda_max, target_states, business_type, work_type, employee_min, employee_max, preferred_software, management_preference })`
2. On success → advance to step 6
3. On error → show inline error message, stay on step 5

---

### Step 6 — Confirmation

**Content:** Summary of the Buy Box organized in labeled sections:
- Organization name
- Revenue range (displayed in millions, e.g. "$2M – $5M")
- EBITDA range (displayed in hundred thousands, e.g. "$300K – $800K")
- Target states (comma-separated codes, e.g. "TX, FL, GA")
- Business type / Work type
- Employee range
- Preferred software / Management preference

**Action:** Single button "Go to dashboard →" → `router.push('/inicio')`

No back navigation from step 6.

---

## Progress Bar

Present on steps 1–5. Label: "Step X of 5". 4px progress bar that advances with each completed step. Same visual treatment as the seller wizard's `assessment-progress` component.

Step 6 (confirmation) does not show a progress bar — it is the terminal state.

---

## Guard Behavior

On mount (before rendering any step):
1. Call `getOwnBuyer()`
2. If record exists → `router.replace('/inicio')`
3. If no record → render wizard from step 1

Show nothing (`return null`) while the guard check is in flight.

---

## Financial Unit Conventions

Consistent with seller wizard:

- `revenue_min` / `revenue_max` — displayed in millions, stored as `value × 1,000,000`
- `ebitda_min` / `ebitda_max` — displayed in hundred thousands, stored as `value × 100,000`

---

## Color Tokens

All styling uses existing CSS custom properties:
- `--estora-white: #fafafa`
- `--estora-dark: #166088`
- `--estora-black: #0a1310`
- `--estora-gray: #5d6a66`
- `--estora-primary: #4A6FA5`

---

## Constraints

- `"use client"` directive required
- All Supabase calls go through `src/app/lib/supabase/` modules — never call Supabase directly from components
- Types from `src/app/lib/types.ts` — do not redefine in other files
- No `router.push` inside form submit handlers for auth-dependent redirects — use `useEffect` pattern where needed (guard only; the wizard's own step transitions are local state, safe to use router directly on explicit user action)
- No test framework — `npx tsc --noEmit` is the type-check gate after each task
- Do not reference `posts`, `addPost`, `getPosts`, or any legacy posts API

---

## Out of Scope

- Editing Buy Box criteria post-onboarding (dashboard feature, future sprint)
- Validation that `target_states` values are valid US codes (frontend guard of "at least 1 selected" is sufficient)
- Events table logging (deferred to future sprint)
