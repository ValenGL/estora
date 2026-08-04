# Seller Onboarding — Business Profile Expansion

**Date:** 2026-08-04
**Status:** Approved

## Problem

The seller onboarding form ("Almost done" step) only collects `company_name`, `annual_revenue`, `ebitda`, `phone`, and `website`. The `sellers` table has 7 additional fields that the buyer matching engine (Sprint 2) requires: `state`, `employee_count`, `years_in_business`, `business_type`, `work_type`, `software`, `management_type`. These fields are currently left null after onboarding, making matching impossible.

## Solution

Expand the existing single business-form step in `src/app/seller/onboarding/page.tsx` to collect all missing required fields. No new steps are added to the wizard — everything stays on the same "Almost done" screen. `asking_price` is explicitly deferred to a later flow (seller profile editing).

## Scope

No DB schema changes needed — all target columns already exist in the `sellers` table.

## Fields Added

All new fields are required at onboarding time.

- `state` — single US state code. Dropdown using `US_STATES` (already imported in buyer onboarding). Type: `string`.
- `employee_count` — total employees. Number input, min 1. Type: `number`.
- `years_in_business` — years the company has operated. Number input, min 0. Type: `number`.
- `business_type` — `residential | commercial | both`. Radio button group.
- `work_type` — `retail | insurance | both`. Radio button group.
- `software` — primary field management software (free text). Type: `string`.
- `management_type` — `owner_operated | has_management_team`. Radio button group.

## Form Layout

Fields displayed in this order within the existing form:

1. Business Name (existing, required)
2. 2026 Total Revenues (existing, required)
3. 2026 Earnings (existing, required)
4. State (new, required — single-select dropdown)
5. Employee Count + Years in Business (new, required — side-by-side row)
6. Business Type (new, required — radio group)
7. Work Type (new, required — radio group)
8. Software (new, required — text input)
9. Management Type (new, required — radio group)
10. Phone Number (existing, optional)
11. Website (existing, optional)

## Changes

### `src/app/seller/onboarding/page.tsx`

- `BusinessFormData` interface: add 7 new string fields (`state`, `employee_count`, `years_in_business`, `business_type`, `work_type`, `management_type` as union literals or `""`, `software` as `string`).
- `form` initial state: initialize all new fields to `""`.
- `isFormValid`: extend to require all 7 new fields are non-empty/valid.
- Form JSX: add inputs in the order defined above, using the same SCSS classes as existing fields (`seller-onboarding-field`, `seller-onboarding-fields`). Radio groups use inline button arrays (same pattern as buyer wizard).
- `handleBusinessSubmit`: pass all new fields to `createSellerProfile`.
- Import `US_STATES` from `../../lib/data/usStates` for the state dropdown.
- Import `BusinessType`, `WorkType`, `ManagementType` from `../../lib/types`.

### `src/app/lib/supabase/sellers.ts`

- `SellerProfileData` interface: add the 7 new required fields with their proper types.
- `createSellerProfile`: include all new fields in the `insert` payload.

## Out of Scope

- `asking_price` — deferred to seller profile editing.
- Seller profile edit page — separate feature.
- Any DB migration — not needed.
