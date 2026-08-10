# Listing Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a role-aware client-side filter bar to `/dashboard` and `/brokerage` so users can narrow listings by state, status, business type, work type, management type, revenue range, EBITDA range, and years in business — and clean up the legacy `account/[id]` stub route.

**Architecture:** A shared `useListingFilters` hook owns all filter state and returns a filtered `Seller[]`. A shared `ListingFilters` component renders the bar in `buyer` or `full` mode. Both listing pages import both units. `sanitizeForBuyer` is loosened to expose `state` and `years_in_business` to buyers. All filtering is client-side AND logic over already-loaded data.

**Tech Stack:** Next.js 15 App Router, TypeScript, React (useState + useMemo), SCSS.

## Global Constraints

- All UI text in English — no Spanish labels anywhere.
- No comments unless the WHY is non-obvious.
- Verification gate: `npx tsc --noEmit` after every task. No test runner installed.
- Do not modify `src/app/lib/supabase/sellers.ts`, `buyers.ts`, or `types.ts`.
- The hook file uses only `useState` and `useMemo` from `'react'` — no default React import.
- SCSS class names follow `listing-filters-*` pattern; no Tailwind inside the new SCSS file.

---

## File Map

**New files:**
- `src/shared/hooks/useListingFilters.ts` — filter state hook + `ListingFilters` interface
- `src/shared/components/listingFilters/listingFilters.tsx` — dumb filter bar component
- `src/shared/components/listingFilters/listingFilters.scss` — filter bar styles

**Modified files:**
- `src/app/lib/utils/sanitize.ts` — remove `state` and `years_in_business` from nulled fields
- `src/app/dashboard/page.tsx` — integrate hook + component, update count display
- `src/app/brokerage/page.tsx` — integrate hook + component, update count display
- `src/app/account/[id]/page.tsx` — replace legacy stub with redirect to `/account`

---

## Task 1: Clean up `account/[id]` legacy stub

**Files:**
- Modify: `src/app/account/[id]/page.tsx`

**Interfaces:**
- Consumes: `redirect` from `next/navigation`
- Produces: the route `/account/[id]` redirects immediately to `/account`

- [ ] **Step 1: Replace the file content**

Replace the entire content of `src/app/account/[id]/page.tsx` with:

```tsx
import { redirect } from "next/navigation";

export default function AccountIdPage() {
  redirect("/account");
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/account/[id]/page.tsx
git commit -m "fix: replace legacy account/[id] stub with redirect to /account"
```

---

## Task 2: Loosen `sanitizeForBuyer`

**Files:**
- Modify: `src/app/lib/utils/sanitize.ts`

**Interfaces:**
- Consumes: `Seller` from `../types`
- Produces: updated `sanitizeForBuyer(seller, index)` — `state` and `years_in_business` are no longer overridden to `null`

- [ ] **Step 1: Remove `state` and `years_in_business` from the nulled fields**

Replace the entire file content:

```ts
import type { Seller } from '../types';

export function sanitizeForBuyer(seller: Seller, index: number): Seller {
  return {
    ...seller,
    company_name: `Roofing Business #${index + 1}`,
    ebitda: null,
    ebitda_margin: null,
    asking_price: null,
    employee_count: null,
    business_type: null,
    work_type: null,
    software: null,
    management_type: null,
    phone: null,
    website: null,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/utils/sanitize.ts
git commit -m "feat: expose state and years_in_business to buyers in sanitizeForBuyer"
```

---

## Task 3: `useListingFilters` hook

**Files:**
- Create: `src/shared/hooks/useListingFilters.ts`

**Interfaces:**
- Consumes: `Seller` from `../../app/lib/types`
- Produces:
  - `ListingFilters` (exported interface — used by `ListingFilters` component in Task 4)
  - `useListingFilters(sellers: Seller[])` — returns `{ filtered: Seller[]; filters: ListingFilters; setFilter: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void; resetFilters: () => void; isFiltered: boolean; }`

- [ ] **Step 1: Create `src/shared/hooks/useListingFilters.ts`**

```ts
import { useState, useMemo } from 'react';
import type { Seller } from '../../app/lib/types';

export interface ListingFilters {
  state: string;
  status: string;
  businessType: string;
  workType: string;
  managementType: string;
  revenueMin: string;
  revenueMax: string;
  ebitdaMin: string;
  ebitdaMax: string;
  yearsMin: string;
  yearsMax: string;
}

const EMPTY: ListingFilters = {
  state: '',
  status: '',
  businessType: '',
  workType: '',
  managementType: '',
  revenueMin: '',
  revenueMax: '',
  ebitdaMin: '',
  ebitdaMax: '',
  yearsMin: '',
  yearsMax: '',
};

export function useListingFilters(sellers: Seller[]) {
  const [filters, setFilters] = useState<ListingFilters>(EMPTY);

  const setFilter = <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(EMPTY);

  const isFiltered = Object.values(filters).some((v) => v !== '');

  const filtered = useMemo(() => {
    return sellers.filter((seller) => {
      if (filters.state && seller.state !== filters.state) return false;
      if (filters.status && seller.status !== filters.status) return false;
      if (filters.businessType && seller.business_type !== filters.businessType) return false;
      if (filters.workType && seller.work_type !== filters.workType) return false;
      if (filters.managementType && seller.management_type !== filters.managementType) return false;

      if (filters.revenueMin !== '') {
        const min = parseFloat(filters.revenueMin) * 1_000_000;
        if (seller.annual_revenue === null || seller.annual_revenue < min) return false;
      }
      if (filters.revenueMax !== '') {
        const max = parseFloat(filters.revenueMax) * 1_000_000;
        if (seller.annual_revenue === null || seller.annual_revenue > max) return false;
      }

      if (filters.ebitdaMin !== '') {
        const min = parseFloat(filters.ebitdaMin) * 100_000;
        if (seller.ebitda === null || seller.ebitda < min) return false;
      }
      if (filters.ebitdaMax !== '') {
        const max = parseFloat(filters.ebitdaMax) * 100_000;
        if (seller.ebitda === null || seller.ebitda > max) return false;
      }

      if (filters.yearsMin !== '') {
        const min = parseInt(filters.yearsMin, 10);
        if (seller.years_in_business === null || seller.years_in_business < min) return false;
      }
      if (filters.yearsMax !== '') {
        const max = parseInt(filters.yearsMax, 10);
        if (seller.years_in_business === null || seller.years_in_business > max) return false;
      }

      return true;
    });
  }, [sellers, filters]);

  return { filtered, filters, setFilter, resetFilters, isFiltered };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/shared/hooks/useListingFilters.ts
git commit -m "feat: add useListingFilters hook"
```

---

## Task 4: `ListingFilters` component

**Files:**
- Create: `src/shared/components/listingFilters/listingFilters.scss`
- Create: `src/shared/components/listingFilters/listingFilters.tsx`

**Interfaces:**
- Consumes:
  - `ListingFilters` from `../../../shared/hooks/useListingFilters`
  - `US_STATES` from `../../../app/lib/data/usStates`
- Produces: `ListingFiltersBar` (default export) — props: `{ filters: ListingFilters; setFilter: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void; resetFilters: () => void; isFiltered: boolean; mode: 'buyer' | 'full' }`

- [ ] **Step 1: Create `listingFilters.scss`**

```scss
.listing-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 1.5rem;
}

.listing-filters-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.listing-filters-label {
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.4;
}

.listing-filters-select {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  padding: 0.375rem 0.625rem;
  font-size: 0.8125rem;
  color: inherit;
  cursor: pointer;
  min-width: 7rem;

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.35);
  }
}

.listing-filters-range {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.listing-filters-input {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  padding: 0.375rem 0.5rem;
  font-size: 0.8125rem;
  color: inherit;
  width: 5rem;

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.35);
  }

  &::placeholder {
    opacity: 0.35;
  }
}

.listing-filters-sep {
  opacity: 0.3;
  font-size: 0.75rem;
}

.listing-filters-clear {
  padding: 0.375rem 0.875rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
  margin-left: auto;
  align-self: flex-end;
  transition: opacity 0.15s, border-color 0.15s;

  &:hover {
    opacity: 1;
    border-color: rgba(255, 255, 255, 0.35);
  }
}
```

- [ ] **Step 2: Create `listingFilters.tsx`**

```tsx
"use client";

import type { ListingFilters } from "../../../shared/hooks/useListingFilters";
import { US_STATES } from "../../../app/lib/data/usStates";
import "./listingFilters.scss";

interface ListingFiltersProps {
  filters: ListingFilters;
  setFilter: <K extends keyof ListingFilters>(key: K, value: ListingFilters[K]) => void;
  resetFilters: () => void;
  isFiltered: boolean;
  mode: 'buyer' | 'full';
}

export default function ListingFiltersBar({
  filters,
  setFilter,
  resetFilters,
  isFiltered,
  mode,
}: ListingFiltersProps) {
  return (
    <div className="listing-filters">

      <div className="listing-filters-group">
        <span className="listing-filters-label">State</span>
        <select
          className="listing-filters-select"
          value={filters.state}
          onChange={(e) => setFilter('state', e.target.value)}
        >
          <option value="">All states</option>
          {US_STATES.map((s) => (
            <option key={s.code} value={s.code}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="listing-filters-group">
        <span className="listing-filters-label">Status</span>
        <select
          className="listing-filters-select"
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Available</option>
          <option value="under_nda">Under NDA</option>
          <option value="sold">Sold</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {mode === 'full' && (
        <>
          <div className="listing-filters-group">
            <span className="listing-filters-label">Business type</span>
            <select
              className="listing-filters-select"
              value={filters.businessType}
              onChange={(e) => setFilter('businessType', e.target.value)}
            >
              <option value="">All types</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="listing-filters-group">
            <span className="listing-filters-label">Work type</span>
            <select
              className="listing-filters-select"
              value={filters.workType}
              onChange={(e) => setFilter('workType', e.target.value)}
            >
              <option value="">All types</option>
              <option value="retail">Retail</option>
              <option value="insurance">Insurance</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="listing-filters-group">
            <span className="listing-filters-label">Management</span>
            <select
              className="listing-filters-select"
              value={filters.managementType}
              onChange={(e) => setFilter('managementType', e.target.value)}
            >
              <option value="">All</option>
              <option value="owner_operated">Owner operated</option>
              <option value="has_management_team">Has management team</option>
            </select>
          </div>
        </>
      )}

      <div className="listing-filters-group">
        <span className="listing-filters-label">Revenue ($M)</span>
        <div className="listing-filters-range">
          <input
            className="listing-filters-input"
            type="number"
            min="0"
            step="0.1"
            placeholder="Min"
            value={filters.revenueMin}
            onChange={(e) => setFilter('revenueMin', e.target.value)}
          />
          <span className="listing-filters-sep">–</span>
          <input
            className="listing-filters-input"
            type="number"
            min="0"
            step="0.1"
            placeholder="Max"
            value={filters.revenueMax}
            onChange={(e) => setFilter('revenueMax', e.target.value)}
          />
        </div>
      </div>

      {mode === 'full' && (
        <div className="listing-filters-group">
          <span className="listing-filters-label">EBITDA (×100K)</span>
          <div className="listing-filters-range">
            <input
              className="listing-filters-input"
              type="number"
              min="0"
              step="0.1"
              placeholder="Min"
              value={filters.ebitdaMin}
              onChange={(e) => setFilter('ebitdaMin', e.target.value)}
            />
            <span className="listing-filters-sep">–</span>
            <input
              className="listing-filters-input"
              type="number"
              min="0"
              step="0.1"
              placeholder="Max"
              value={filters.ebitdaMax}
              onChange={(e) => setFilter('ebitdaMax', e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="listing-filters-group">
        <span className="listing-filters-label">Years in business</span>
        <div className="listing-filters-range">
          <input
            className="listing-filters-input"
            type="number"
            min="0"
            step="1"
            placeholder="Min"
            value={filters.yearsMin}
            onChange={(e) => setFilter('yearsMin', e.target.value)}
          />
          <span className="listing-filters-sep">–</span>
          <input
            className="listing-filters-input"
            type="number"
            min="0"
            step="1"
            placeholder="Max"
            value={filters.yearsMax}
            onChange={(e) => setFilter('yearsMax', e.target.value)}
          />
        </div>
      </div>

      {isFiltered && (
        <button
          className="listing-filters-clear"
          onClick={resetFilters}
          type="button"
        >
          Clear filters
        </button>
      )}

    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/shared/components/listingFilters/
git commit -m "feat: add ListingFilters component"
```

---

## Task 5: Dashboard integration

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes:
  - `useListingFilters` + `ListingFilters` (interface) from `../../shared/hooks/useListingFilters`
  - `ListingFiltersBar` (default export) from `../../shared/components/listingFilters/listingFilters`
  - existing: `getAllSellers`, `deleteSeller`, `sanitizeForBuyer`, `useAuth`, `useRouter`, `ProtectedRoute`, `SellerCard`, `Loader`, `Seller`
- Produces: updated dashboard — filter bar above the card grid, count shows "X of Y" when filtered

- [ ] **Step 1: Replace `src/app/dashboard/page.tsx`**

```tsx
"use client";

import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "../../shared/components/loader/loader";
import SellerCard from "../../shared/components/sellerCard/sellerCard";
import ListingFiltersBar from "../../shared/components/listingFilters/listingFilters";
import { useListingFilters } from "../../shared/hooks/useListingFilters";
import { getAllSellers, deleteSeller } from "../lib/supabase/sellers";
import type { Seller } from "../lib/types";
import { sanitizeForBuyer } from "../lib/utils/sanitize";
import ProtectedRoute from "../utils/protectedRoute";
import { useAuth } from "../utils/isAuth";

const DashboardPage = () => {
  const { effectiveRole } = useAuth();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (effectiveRole === 'seller' || effectiveRole === 'pending') {
    redirect('/inicio');
  }

  useEffect(() => {
    getAllSellers()
      .then(setSellers)
      .catch(() => setError('Failed to load listings. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const isBuyer = effectiveRole === 'buyer';
  const isBroker = effectiveRole === 'broker';

  const { filtered, filters, setFilter, resetFilters, isFiltered } = useListingFilters(sellers);

  const displaySellers = isBuyer ? filtered.map(sanitizeForBuyer) : filtered;

  const handleDelete = async (id: string) => {
    try {
      await deleteSeller(id);
      setSellers((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Failed to delete listing.');
    }
  };

  const countLabel = isFiltered
    ? `${filtered.length} of ${sellers.length} ${sellers.length === 1 ? 'listing' : 'listings'}`
    : `${sellers.length} ${sellers.length === 1 ? 'listing' : 'listings'}`;

  return (
    <section className="p-4 sm:p-6 animate-fadeInUp">

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">All Listings</h1>
        {!loading && (
          <span className="text-sm opacity-60 font-medium">{countLabel}</span>
        )}
        {isBroker && (
          <button
            className="ml-auto text-sm px-4 py-2 rounded-lg border border-white/20 hover:border-white/50 transition-colors"
            onClick={() => router.push('/brokerage/listings/new')}
            type="button"
          >
            New listing
          </button>
        )}
      </div>

      {isBuyer && (
        <div className="mb-6 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-sm">
          You are viewing anonymized listings. Request access to unlock full details.
        </div>
      )}

      {!loading && (
        <ListingFiltersBar
          filters={filters}
          setFilter={setFilter}
          resetFilters={resetFilters}
          isFiltered={isFiltered}
          mode={isBuyer ? 'buyer' : 'full'}
        />
      )}

      {loading && <Loader block />}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && filtered.length === 0 && sellers.length > 0 && (
        <p className="opacity-60">No listings match the current filters.</p>
      )}

      {!loading && !error && sellers.length === 0 && (
        <p className="opacity-60">No listings available yet.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displaySellers.map((seller) => (
            <SellerCard
              key={seller.id}
              seller={seller}
              blurred={isBuyer}
              onEdit={isBroker ? () => router.push(`/brokerage/listings/${seller.id}/edit`) : undefined}
              onDelete={isBroker ? () => handleDelete(seller.id) : undefined}
            />
          ))}
        </div>
      )}

    </section>
  );
};

export default ProtectedRoute(DashboardPage);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add listing filters to dashboard"
```

---

## Task 6: Brokerage page integration

**Files:**
- Modify: `src/app/brokerage/page.tsx`

**Interfaces:**
- Consumes:
  - `useListingFilters` + `ListingFilters` (interface) from `../../shared/hooks/useListingFilters`
  - `ListingFiltersBar` (default export) from `../../shared/components/listingFilters/listingFilters`
  - existing: `getAllSellers`, `deleteSeller`, `useAuth`, `useRouter`, `ProtectedRoute`, `Loader`, `Seller`
- Produces: updated brokerage page — filter bar above the table, count shows "X of Y" when filtered

- [ ] **Step 1: Replace `src/app/brokerage/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { useAuth } from "../utils/isAuth";
import { getAllSellers, deleteSeller } from "../lib/supabase/sellers";
import type { Seller } from "../lib/types";
import Loader from "../../shared/components/loader/loader";
import ListingFiltersBar from "../../shared/components/listingFilters/listingFilters";
import { useListingFilters } from "../../shared/hooks/useListingFilters";
import ProtectedRoute from "../utils/protectedRoute";

function formatMoney(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

const STATUS_LABEL: Record<Seller['status'], string> = {
  active: 'Available',
  under_nda: 'Under NDA',
  sold: 'Sold',
  inactive: 'Inactive',
};

const STATUS_COLOR: Record<Seller['status'], string> = {
  active: 'text-green-400',
  under_nda: 'text-amber-400',
  sold: 'text-gray-400',
  inactive: 'text-gray-500',
};

const BrokeragePage = () => {
  const { effectiveRole } = useAuth();
  const router = useRouter();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (effectiveRole !== 'broker' && effectiveRole !== null) {
    redirect('/inicio');
  }

  useEffect(() => {
    getAllSellers()
      .then(setSellers)
      .catch(() => setError('Failed to load listings.'))
      .finally(() => setLoading(false));
  }, []);

  const { filtered, filters, setFilter, resetFilters, isFiltered } = useListingFilters(sellers);

  const handleDelete = async (id: string) => {
    try {
      await deleteSeller(id);
      setSellers((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Failed to delete listing.');
    } finally {
      setDeletingId(null);
    }
  };

  const countLabel = isFiltered
    ? `${filtered.length} of ${sellers.length} ${sellers.length === 1 ? 'listing' : 'listings'}`
    : `${sellers.length} ${sellers.length === 1 ? 'listing' : 'listings'}`;

  return (
    <section className="p-4 sm:p-6 animate-fadeInUp">

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">Listings</h1>
        {!loading && (
          <span className="text-sm opacity-60 font-medium">{countLabel}</span>
        )}
        <button
          className="ml-auto text-sm px-4 py-2 rounded-lg border border-white/20 hover:border-white/50 transition-colors"
          onClick={() => router.push('/brokerage/listings/new')}
          type="button"
        >
          New listing
        </button>
      </div>

      {!loading && (
        <ListingFiltersBar
          filters={filters}
          setFilter={setFilter}
          resetFilters={resetFilters}
          isFiltered={isFiltered}
          mode="full"
        />
      )}

      {loading && <Loader block />}
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {!loading && !error && sellers.length === 0 && (
        <div className="opacity-60">
          <p>No listings yet.</p>
          <button className="underline text-sm mt-1" onClick={() => router.push('/brokerage/listings/new')} type="button">
            Create your first listing
          </button>
        </div>
      )}

      {!loading && !error && sellers.length > 0 && filtered.length === 0 && (
        <p className="opacity-60">No listings match the current filters.</p>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left opacity-50 uppercase text-xs tracking-wider border-b border-white/10">
                <th className="pb-2 pr-4 font-medium">Company</th>
                <th className="pb-2 pr-4 font-medium">State</th>
                <th className="pb-2 pr-4 font-medium">Revenue</th>
                <th className="pb-2 pr-4 font-medium">EBITDA</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((seller) => (
                <tr key={seller.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 pr-4 font-medium">{seller.company_name}</td>
                  <td className="py-3 pr-4 opacity-70">{seller.state ?? '—'}</td>
                  <td className="py-3 pr-4">{formatMoney(seller.annual_revenue)}</td>
                  <td className="py-3 pr-4">{formatMoney(seller.ebitda)}</td>
                  <td className={`py-3 pr-4 font-medium ${STATUS_COLOR[seller.status]}`}>
                    {STATUS_LABEL[seller.status]}
                  </td>
                  <td className="py-3">
                    {deletingId === seller.id ? (
                      <span className="flex items-center gap-2">
                        <span className="text-xs opacity-60">Delete?</span>
                        <button
                          className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                          onClick={() => handleDelete(seller.id)}
                          type="button"
                        >
                          Confirm
                        </button>
                        <button
                          className="text-xs px-2 py-1 rounded border border-white/20 hover:border-white/50 transition-colors"
                          onClick={() => setDeletingId(null)}
                          type="button"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <button
                          className="text-xs px-2 py-1 rounded border border-white/20 hover:border-white/50 transition-colors"
                          onClick={() => router.push(`/brokerage/listings/${seller.id}/edit`)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs px-2 py-1 rounded border border-red-500/30 text-red-400 hover:border-red-400 transition-colors"
                          onClick={() => setDeletingId(seller.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </section>
  );
};

export default ProtectedRoute(BrokeragePage);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/brokerage/page.tsx
git commit -m "feat: add listing filters to brokerage page"
```

---

## Self-Review

**Spec coverage:**
- Sanitize loosening (`state`, `years_in_business`) → Task 2 ✓
- `useListingFilters` hook with all 11 filter fields → Task 3 ✓
- `ListingFilters` component with `buyer`/`full` mode → Task 4 ✓
- Dashboard integration with role-aware mode → Task 5 ✓
- Brokerage page integration → Task 6 ✓
- Legacy `account/[id]` cleanup → Task 1 ✓
- Count shows "X of Y" when filtered → Tasks 5 & 6 ✓
- Empty state when filters produce no results → Tasks 5 & 6 ✓

**Type consistency:**
- `ListingFilters` interface exported from `useListingFilters.ts`, imported in `listingFilters.tsx`, `dashboard/page.tsx`, `brokerage/page.tsx` ✓
- `setFilter` generic signature consistent across all consumers ✓
- `ListingFiltersBar` default export matches import name in Tasks 5 & 6 ✓
- `useListingFilters` named export matches imports in Tasks 5 & 6 ✓

**No placeholders:** All steps have full code. ✓
