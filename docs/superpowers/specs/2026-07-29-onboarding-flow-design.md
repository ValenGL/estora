# Onboarding Flow — Design Spec

**Date:** 2026-07-29
**Sprint:** 2
**Status:** Approved

## Overview

A two-step post-registration onboarding flow that captures role (buyer/seller) and a unique username before granting access to the platform. Implemented as a single route `/onboarding` with local step state.

## Flow

```
signup (email + password)
  → profiles row created with role: "pending", username: email prefix (temp)
  → redirect to /onboarding

/onboarding — Step 1: Role selection
  → user clicks BUY or SELL
  → Supabase: profiles.role updated to "buyer" or "seller"
  → advance to Step 2 (Step 1 locked — no back)

/onboarding — Step 2: Username
  → hot validation inline as user types
  → submit: uniqueness check via Supabase
  → Supabase: profiles.username updated
  → redirect to /inicio
```

## Guard

Any authenticated user with `role === "pending"` is redirected to `/onboarding`. This catches users who interrupted the flow mid-session. Applied in the `/inicio` layout (and any other protected route layout).

## Screens

### Step 1 — Role Selection

Two panels side by side, each `50dvw`, full viewport height.

- Left panel: **SELL** — "I want to sell my roofing business"
- Right panel: **BUY** — "I want to acquire a roofing business"
- Clicking a panel triggers the Supabase update immediately — no confirmation button
- Loading state shown on the clicked panel during the async call
- No back navigation from Step 2 to Step 1

### Step 2 — Username

Centered single-column layout.

- One text input for username
- Hot validation (inline errors as the user types) on format rules — see Validation below
- Submit button enabled only when format is valid
- On submit: uniqueness check against Supabase
  - If taken: inline error "This username is already taken"
  - If available: update `profiles.username`, redirect to `/inicio`

## Validation Rules

All rules enforced on the frontend before submit. Uniqueness enforced on submit only.

- Allowed characters: `a-z`, `0-9`, `_`, `-` (regex: `/^[a-z0-9_-]+$/i`)
- Length: minimum 3 characters, maximum 20 characters
- Must start with a letter (`/^[a-z]/i`)
- No spaces
- Stored and compared as lowercase

These rules form a whitelist that eliminates all SQL-dangerous characters (`'`, `"`, `;`, `--`, `/*`) regardless of downstream query handling.

## Data Layer Changes

### `src/app/lib/types.ts`
Add `"pending"` to the `Role` union:
```ts
export type Role = 'broker' | 'buyer' | 'seller' | 'pending';
```

### `src/app/lib/supabase/auth.ts`
`signup` passes `role: "pending"` instead of `"buyer"`. The `on_auth_user_created` trigger reads this from `raw_user_meta_data` — no trigger change needed.

### `src/app/lib/supabase/profiles.ts`
`updateProfile` currently only accepts `username`. Extend to also accept `role` so the onboarding can update both fields independently:
```ts
updates: Partial<Pick<Profile, 'username' | 'role'>>
```

### `src/shared/components/registerForm/registerForm.tsx`
- Remove username generation (`email.split("@")[0]`) from the signup call — pass an empty string or email prefix as before (the trigger still needs a value; email prefix is fine as a temporary placeholder)
- Remove the confirmation email modal
- On successful signup, redirect to `/onboarding`

### New file: `src/app/onboarding/page.tsx`
Single page component with `step: 1 | 2` local state. No URL change between steps.

## Out of Scope

- Buyer-specific questionnaire (future step after username)
- Seller-specific questionnaire (future step after username)
- Ability to change role after onboarding
- Back navigation from Step 2 to Step 1
