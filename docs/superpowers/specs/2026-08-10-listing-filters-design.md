# Listing Filters — Design Spec

**Date:** 2026-08-10
**Status:** Approved
**Sprint:** 5 — Listing Filters

---

## Goal

Add a client-side filter bar to both the `/dashboard` (broker + buyer) and `/brokerage` (broker only) pages so users can narrow the listings list by state, status, financial ranges, and operational characteristics without any server round-trips.

---

## Sanitize Change

`src/app/lib/utils/sanitize.ts` — remove `state` and `years_in_business` from the nulled fields in `sanitizeForBuyer`. Both are safe to expose to buyers (no identifying risk).

Fields that remain anonymized for buyers: `company_name`, `ebitda`, `ebitda_margin`, `asking_price`, `employee_count`, `business_type`, `work_type`, `software`, `management_type`, `phone`, `website`.

Fields now visible to buyers: `state`, `annual_revenue`, `years_in_business`, `status`.

---

## Architecture

Two new shared units, consumed by both listing pages. No Supabase changes.

### `useListingFilters` hook

**File:** `src/shared/hooks/useListingFilters.ts`

Accepts `Seller[]`, manages all filter state internally, returns:

```ts
{
  filtered: Seller[];
  filters: ListingFilters;
  setFilter: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void;
  resetFilters: () => void;
  isFiltered: boolean;
}
```

Filter state shape:

```ts
interface ListingFilters {
  state: string;           // '' = no filter
  status: string;          // '' = no filter (SellerStatus | '')
  businessType: string;    // '' = no filter (BusinessType | '')
  workType: string;        // '' = no filter (WorkType | '')
  managementType: string;  // '' = no filter (ManagementType | '')
  revenueMin: string;      // '' = no lower bound (display units: millions)
  revenueMax: string;      // '' = no upper bound
  ebitdaMin: string;       // '' = no lower bound (display units: hundred-thousands)
  ebitdaMax: string;       // '' = no upper bound
  yearsMin: string;        // '' = no lower bound
  yearsMax: string;        // '' = no upper bound
}
```

All fields default to `''`. Filtering is AND logic: every active filter must match. Numeric range checks treat blank as no constraint on that side. A filter on a `null` field value never matches (e.g. a seller with `state: null` will not appear when a state filter is set).

`isFiltered` is `true` when any field is non-empty.

### `ListingFilters` component

**Files:**
- `src/shared/components/listingFilters/listingFilters.tsx`
- `src/shared/components/listingFilters/listingFilters.scss`

Props:

```ts
interface ListingFiltersProps {
  filters: ListingFilters;
  setFilter: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void;
  resetFilters: () => void;
  isFiltered: boolean;
  mode: 'buyer' | 'full';
}
```

Dumb display component — no internal state, no logic. Renders the filter bar based on `mode`.

**`mode="buyer"`** renders: state select, status select, revenue range (min/max), years in business range (min/max).

**`mode="full"`** renders: state select, status select, business type select, work type select, management type select, revenue range (min/max), EBITDA range (min/max), years in business range (min/max).

Layout: single horizontal bar, wraps on small screens. Categorical selects on the left, numeric range pairs grouped in the middle, "Clear filters" button on the right. "Clear filters" only renders when `isFiltered` is true.

State select options: all 51 US state codes from `US_STATES`.
Status options: active, under_nda, sold, inactive (same labels as `STATUS_LABEL`).
Business type options: residential, commercial, both.
Work type options: retail, insurance, both.
Management type options: owner_operated, has_management_team (displayed as "owner operated", "has management team").

Revenue inputs are labeled in millions (e.g. placeholder "Min $M"). EBITDA inputs in hundred-thousands. Years inputs are plain integers.

---

## Page Integration

### `src/app/dashboard/page.tsx`

- Import `useListingFilters` and `ListingFilters`.
- Pass the raw `sellers` array (pre-sanitize) to `useListingFilters`; then apply `sanitizeForBuyer` on `filtered` for the buyer display.
- Render `<ListingFilters>` between the page header and the listing grid, with `mode={isBuyer ? 'buyer' : 'full'}`.
- Update the listings count: when `isFiltered`, show `"{filtered.length} of {sellers.length} listings"` instead of `"{sellers.length} listings"`.

### `src/app/brokerage/page.tsx`

- Import `useListingFilters` and `ListingFilters`.
- Pass `sellers` to `useListingFilters`, use `filtered` for the table.
- Render `<ListingFilters>` between the page header and the table, `mode="full"`.
- Same count update pattern.

---

## SCSS

Class naming: `listing-filters-*`. Follows the same token pattern as other components in the project (rgba white borders, transparent backgrounds, white selected state). No Tailwind in the new SCSS file.

Key classes:
- `.listing-filters` — flex container, wraps, gap between groups
- `.listing-filters-group` — groups related inputs (e.g. a label + two range inputs)
- `.listing-filters-label` — small uppercase opacity label above a group
- `.listing-filters-select` — categorical select input
- `.listing-filters-range` — wrapper for min/max pair
- `.listing-filters-input` — numeric input
- `.listing-filters-clear` — clear button, only rendered when `isFiltered`

---

## Constraints

- All UI text in English.
- No comments unless the WHY is non-obvious.
- Verification: `npx tsc --noEmit` after each task. No test runner installed.
- Do not modify `sellers.ts`, `buyers.ts`, or `types.ts`.
- The hook file must not import React — it uses only `useState` and `useMemo` from `'react'`.
