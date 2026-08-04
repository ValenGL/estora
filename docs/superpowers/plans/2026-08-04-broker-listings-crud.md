# Broker Listings CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the broker full create/edit/delete control over seller listings from both the `/dashboard` card grid and a dedicated `/brokerage` management table, without exposing any controls to buyers or sellers.

**Architecture:** A new `brokerSellers.ts` data function handles broker-only inserts. A shared `ListingForm` component is consumed by two new Next.js pages (`/brokerage/listings/new` and `/brokerage/listings/[id]/edit`). The dashboard and `/brokerage` pages each get broker-conditional controls wired to those routes. Verification is TypeScript compilation (`npx tsc --noEmit`) after each task since no test runner is configured.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase JS client, SCSS, Tailwind CSS.

## Global Constraints

- All UI text in English only — no Spanish labels anywhere.
- No comments unless the WHY is non-obvious.
- Do not reference `posts`, `addPost`, `getPosts`, `getOwnPosts`, `getPostById`, or `deletePost`.
- All financial values stored in raw USD (`annual_revenue`, `ebitda`, `asking_price`). Form inputs are in human units (millions / hundred-thousands) and converted on submit.
- `profile_id` for broker-created sellers = authenticated broker's user id from `supabase.auth.getUser()`.
- Broker-only routes redirect non-broker roles to `/inicio`.
- Buyers must never see Edit/Delete controls.

---

## File Map

**New files:**
- `src/app/lib/supabase/brokerSellers.ts` — `createSellerAsBroker` function + `BrokerSellerInput` type
- `src/shared/components/listingForm/listingForm.tsx` — shared create/edit form component
- `src/shared/components/listingForm/listingForm.scss` — form styles (mirrors account page patterns)
- `src/app/brokerage/listings/new/page.tsx` — create listing page
- `src/app/brokerage/listings/[id]/edit/page.tsx` — edit listing page

**Modified files:**
- `src/shared/components/sellerCard/sellerCard.tsx` — add optional `onEdit`/`onDelete` props + action row
- `src/shared/components/sellerCard/sellerCard.scss` — add `.seller-card-actions` styles
- `src/app/dashboard/page.tsx` — broker "New listing" button + pass `onEdit`/`onDelete` to cards
- `src/app/brokerage/page.tsx` — replace existing marketing content with broker management table

---

## Task 1: Data layer — `brokerSellers.ts`

**Files:**
- Create: `src/app/lib/supabase/brokerSellers.ts`

**Interfaces:**
- Consumes: `supabase` from `./supabase`, `Seller`, `BusinessType`, `WorkType`, `ManagementType`, `SellerStatus` from `../types`
- Produces: `BrokerSellerInput` (interface), `createSellerAsBroker(data: BrokerSellerInput): Promise<Seller>`

- [ ] **Step 1: Create the file**

`src/app/lib/supabase/brokerSellers.ts`:

```ts
import { supabase } from './supabase';
import type { Seller, BusinessType, WorkType, ManagementType, SellerStatus } from '../types';

export interface BrokerSellerInput {
  company_name: string;
  state: string;
  annual_revenue: number;
  ebitda: number;
  employee_count: number;
  years_in_business: number;
  business_type: BusinessType;
  work_type: WorkType;
  software: string;
  management_type: ManagementType;
  asking_price: number | null;
  status: SellerStatus;
  phone: string | null;
  website: string | null;
}

export const createSellerAsBroker = async (data: BrokerSellerInput): Promise<Seller> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('No authenticated user');

  const { data: seller, error } = await supabase
    .from('sellers')
    .insert({ ...data, profile_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return seller as Seller;
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/supabase/brokerSellers.ts
git commit -m "feat: add createSellerAsBroker data function"
```

---

## Task 2: Shared `ListingForm` component

**Files:**
- Create: `src/shared/components/listingForm/listingForm.tsx`
- Create: `src/shared/components/listingForm/listingForm.scss`

**Interfaces:**
- Consumes: `BrokerSellerInput` from `../../../app/lib/supabase/brokerSellers`, `US_STATES` from `../../../app/lib/data/usStates`, `BusinessType`, `WorkType`, `ManagementType`, `SellerStatus` from `../../../app/lib/types`
- Produces: `ListingForm` (default export) — props: `{ initialValues?: Partial<BrokerSellerInput>; onSubmit: (data: BrokerSellerInput) => Promise<void>; submitLabel: string; onCancel: () => void }`

- [ ] **Step 1: Create the SCSS file**

`src/shared/components/listingForm/listingForm.scss`:

```scss
.listing-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 640px;
}

.listing-form-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  label {
    font-size: 0.75rem;
    opacity: 0.5;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  input,
  select {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 0.5rem;
    padding: 0.625rem 0.875rem;
    font-size: 0.9375rem;
    color: inherit;
    width: 100%;

    &:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.4);
    }

    &:disabled {
      opacity: 0.5;
    }
  }
}

.listing-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.listing-form-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.listing-form-radio-btn {
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-transform: capitalize;
  transition: border-color 0.15s, background 0.15s, color 0.15s;

  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.4);
  }

  &--selected {
    background: white;
    color: black;
    border-color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.listing-form-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.5rem;
}

.listing-form-btn {
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: inherit;
  transition: border-color 0.15s, opacity 0.15s;

  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.4);
  }

  &--primary {
    background: white;
    color: black;
    border-color: white;

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  &--ghost {
    border: none;
    opacity: 0.6;

    &:hover:not(:disabled) {
      opacity: 1;
    }
  }
}

.listing-form-error {
  color: #f87171;
  font-size: 0.875rem;
}
```

- [ ] **Step 2: Create the component file**

`src/shared/components/listingForm/listingForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { BrokerSellerInput } from "../../../app/lib/supabase/brokerSellers";
import type { BusinessType, WorkType, ManagementType, SellerStatus } from "../../../app/lib/types";
import { US_STATES } from "../../../app/lib/data/usStates";
import "./listingForm.scss";

interface ListingFormProps {
  initialValues?: Partial<BrokerSellerInput>;
  onSubmit: (data: BrokerSellerInput) => Promise<void>;
  submitLabel: string;
  onCancel: () => void;
}

interface FormState {
  company_name: string;
  annual_revenue: string;
  ebitda: string;
  asking_price: string;
  state: string;
  employee_count: string;
  years_in_business: string;
  business_type: BusinessType | "";
  work_type: WorkType | "";
  software: string;
  management_type: ManagementType | "";
  status: SellerStatus | "";
  phone: string;
  website: string;
}

function initForm(v?: Partial<BrokerSellerInput>): FormState {
  return {
    company_name: v?.company_name ?? "",
    annual_revenue: v?.annual_revenue != null ? String(v.annual_revenue / 1_000_000) : "",
    ebitda: v?.ebitda != null ? String(v.ebitda / 100_000) : "",
    asking_price: v?.asking_price != null ? String(v.asking_price / 1_000_000) : "",
    state: v?.state ?? "",
    employee_count: v?.employee_count != null ? String(v.employee_count) : "",
    years_in_business: v?.years_in_business != null ? String(v.years_in_business) : "",
    business_type: v?.business_type ?? "",
    work_type: v?.work_type ?? "",
    software: v?.software ?? "",
    management_type: v?.management_type ?? "",
    status: v?.status ?? "",
    phone: v?.phone ?? "",
    website: v?.website ?? "",
  };
}

export default function ListingForm({ initialValues, onSubmit, submitLabel, onCancel }: ListingFormProps) {
  const [form, setForm] = useState<FormState>(() => initForm(initialValues));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (name: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const revNum = parseFloat(form.annual_revenue);
  const ebitdaNum = parseFloat(form.ebitda);
  const askNum = parseFloat(form.asking_price);
  const empNum = parseInt(form.employee_count, 10);
  const yrsNum = parseInt(form.years_in_business, 10);

  const isValid =
    form.company_name.trim() !== "" &&
    !isNaN(revNum) && revNum >= 0 &&
    !isNaN(ebitdaNum) && ebitdaNum >= 0 &&
    (form.asking_price === "" || (!isNaN(askNum) && askNum >= 0)) &&
    form.state !== "" &&
    !isNaN(empNum) && empNum >= 1 &&
    !isNaN(yrsNum) && yrsNum >= 0 &&
    form.business_type !== "" &&
    form.work_type !== "" &&
    form.software.trim() !== "" &&
    form.management_type !== "" &&
    form.status !== "";

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        company_name: form.company_name.trim(),
        annual_revenue: revNum * 1_000_000,
        ebitda: ebitdaNum * 100_000,
        asking_price: form.asking_price !== "" ? askNum * 1_000_000 : null,
        state: form.state,
        employee_count: empNum,
        years_in_business: yrsNum,
        business_type: form.business_type as BusinessType,
        work_type: form.work_type as WorkType,
        software: form.software.trim(),
        management_type: form.management_type as ManagementType,
        status: form.status as SellerStatus,
        phone: form.phone.trim() || null,
        website: form.website.trim() || null,
      });
    } catch {
      setError("Failed to save. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="listing-form">
      <div className="listing-form-field">
        <label htmlFor="company_name">Company name *</label>
        <input id="company_name" type="text" value={form.company_name} onChange={set("company_name")} disabled={submitting} />
      </div>

      <div className="listing-form-row">
        <div className="listing-form-field">
          <label htmlFor="annual_revenue">Revenue (millions) *</label>
          <input id="annual_revenue" type="number" step="0.1" min="0" value={form.annual_revenue} onChange={set("annual_revenue")} disabled={submitting} />
        </div>
        <div className="listing-form-field">
          <label htmlFor="ebitda">EBITDA (hundred thousands) *</label>
          <input id="ebitda" type="number" step="0.1" min="0" value={form.ebitda} onChange={set("ebitda")} disabled={submitting} />
        </div>
      </div>

      <div className="listing-form-row">
        <div className="listing-form-field">
          <label htmlFor="asking_price">Asking price (millions)</label>
          <input id="asking_price" type="number" step="0.1" min="0" value={form.asking_price} onChange={set("asking_price")} disabled={submitting} />
        </div>
        <div className="listing-form-field">
          <label htmlFor="state">State *</label>
          <select id="state" value={form.state} onChange={set("state")} disabled={submitting}>
            <option value="">Select a state...</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="listing-form-row">
        <div className="listing-form-field">
          <label htmlFor="employee_count">Employees *</label>
          <input id="employee_count" type="number" min="1" step="1" value={form.employee_count} onChange={set("employee_count")} disabled={submitting} />
        </div>
        <div className="listing-form-field">
          <label htmlFor="years_in_business">Years in business *</label>
          <input id="years_in_business" type="number" min="0" step="1" value={form.years_in_business} onChange={set("years_in_business")} disabled={submitting} />
        </div>
      </div>

      <div className="listing-form-field">
        <label>Business type *</label>
        <div className="listing-form-radio-group">
          {(["residential", "commercial", "both"] as BusinessType[]).map((opt) => (
            <button key={opt} type="button"
              className={`listing-form-radio-btn${form.business_type === opt ? " listing-form-radio-btn--selected" : ""}`}
              onClick={() => setForm((p) => ({ ...p, business_type: opt }))}
              disabled={submitting}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="listing-form-field">
        <label>Work type *</label>
        <div className="listing-form-radio-group">
          {(["retail", "insurance", "both"] as WorkType[]).map((opt) => (
            <button key={opt} type="button"
              className={`listing-form-radio-btn${form.work_type === opt ? " listing-form-radio-btn--selected" : ""}`}
              onClick={() => setForm((p) => ({ ...p, work_type: opt }))}
              disabled={submitting}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="listing-form-field">
        <label htmlFor="software">Software *</label>
        <input id="software" type="text" value={form.software} onChange={set("software")} disabled={submitting} />
      </div>

      <div className="listing-form-field">
        <label>Management *</label>
        <div className="listing-form-radio-group">
          {(["owner_operated", "has_management_team"] as ManagementType[]).map((opt) => (
            <button key={opt} type="button"
              className={`listing-form-radio-btn${form.management_type === opt ? " listing-form-radio-btn--selected" : ""}`}
              onClick={() => setForm((p) => ({ ...p, management_type: opt }))}
              disabled={submitting}>
              {opt.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="listing-form-field">
        <label htmlFor="status">Status *</label>
        <select id="status" value={form.status} onChange={set("status")} disabled={submitting}>
          <option value="">Select a status...</option>
          <option value="active">Active</option>
          <option value="under_nda">Under NDA</option>
          <option value="sold">Sold</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="listing-form-row">
        <div className="listing-form-field">
          <label htmlFor="phone">Phone</label>
          <input id="phone" type="tel" value={form.phone} onChange={set("phone")} disabled={submitting} />
        </div>
        <div className="listing-form-field">
          <label htmlFor="website">Website</label>
          <input id="website" type="url" value={form.website} onChange={set("website")} disabled={submitting} />
        </div>
      </div>

      {error && <p className="listing-form-error">{error}</p>}

      <div className="listing-form-actions">
        <button className="listing-form-btn listing-form-btn--primary" onClick={handleSubmit} disabled={!isValid || submitting} type="button">
          {submitting ? "Saving..." : submitLabel}
        </button>
        <button className="listing-form-btn listing-form-btn--ghost" onClick={onCancel} disabled={submitting} type="button">
          Cancel
        </button>
      </div>
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
git add src/shared/components/listingForm/
git commit -m "feat: add shared ListingForm component"
```

---

## Task 3: SellerCard broker controls

**Files:**
- Modify: `src/shared/components/sellerCard/sellerCard.tsx`
- Modify: `src/shared/components/sellerCard/sellerCard.scss`

**Interfaces:**
- Consumes: existing `SellerCardProps` + new optional `onEdit?: () => void`, `onDelete?: () => void`
- Produces: updated `SellerCard` — renders action row at bottom when either prop is present; delete shows inline confirmation before calling `onDelete`

- [ ] **Step 1: Add `.seller-card-actions` styles to the SCSS**

In `sellerCard.scss`, append:

```scss
.seller-card-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 0.25rem;
}

.seller-card-action-btn {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: inherit;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
  }

  &--danger {
    border-color: rgba(239, 68, 68, 0.4);
    color: #f87171;

    &:hover {
      border-color: #f87171;
    }
  }

  &--confirm {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
  }
}

.seller-card-confirm-text {
  font-size: 0.75rem;
  opacity: 0.7;
  align-self: center;
}
```

- [ ] **Step 2: Update `sellerCard.tsx`**

Replace the entire file content:

```tsx
"use client";

import { useState } from "react";
import type { Seller } from '../../../app/lib/types';
import "./sellerCard.scss";

interface SellerCardProps {
  seller: Seller;
  blurred?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

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

function BlurredField({ children, active }: { children: React.ReactNode; active: boolean }) {
  if (!active) return <>{children}</>;
  return <span className="blur-field">{children}</span>;
}

export default function SellerCard({ seller, blurred = false, onEdit, onDelete }: SellerCardProps) {
  const [confirming, setConfirming] = useState(false);

  const handleDeleteClick = () => setConfirming(true);
  const handleConfirm = () => { setConfirming(false); onDelete?.(); };
  const handleCancel = () => setConfirming(false);

  const hasActions = onEdit !== undefined || onDelete !== undefined;

  return (
    <div className="seller-card u-bgcolor-estora-black u-color-estora-white rounded-2xl p-4 flex flex-col gap-3 shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)]">

      <div>
        <span className={`status-badge status-badge--${seller.status}`}>
          {STATUS_LABEL[seller.status]}
        </span>
      </div>

      <div>
        <BlurredField active={blurred}>
          <h3 className="text-lg font-semibold leading-tight">
            {seller.company_name}
          </h3>
        </BlurredField>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="opacity-60 text-xs uppercase tracking-wider">Revenue</span>
          <p className="text-base font-bold">{formatMoney(seller.annual_revenue)}</p>
        </div>
        <div className="text-right">
          <span className="opacity-60 text-xs uppercase tracking-wider">State</span>
          <p className="text-base font-bold">{seller.state ?? '—'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="opacity-60 text-xs uppercase tracking-wider">EBITDA</span>
          <BlurredField active={blurred}>
            <p className="text-base font-bold">{formatMoney(seller.ebitda)}</p>
          </BlurredField>
        </div>
        <div className="text-right">
          <span className="opacity-60 text-xs uppercase tracking-wider">Asking</span>
          <BlurredField active={blurred}>
            <p className="text-base font-bold">{formatMoney(seller.asking_price)}</p>
          </BlurredField>
        </div>
      </div>

      <BlurredField active={blurred}>
        <div className="flex flex-wrap gap-1">
          {seller.business_type && <span className="chip">{seller.business_type}</span>}
          {seller.work_type && <span className="chip">{seller.work_type}</span>}
        </div>
      </BlurredField>

      <div className="flex items-center justify-between text-xs opacity-70 pt-1 border-t border-white/10">
        <BlurredField active={blurred}>
          <span>{seller.years_in_business != null ? `${seller.years_in_business} yrs` : '—'}</span>
        </BlurredField>
        <BlurredField active={blurred}>
          <span>{seller.employee_count != null ? `${seller.employee_count} employees` : '—'}</span>
        </BlurredField>
      </div>

      {hasActions && (
        <div className="seller-card-actions">
          {confirming ? (
            <>
              <span className="seller-card-confirm-text">Delete this listing?</span>
              <button className="seller-card-action-btn seller-card-action-btn--confirm" onClick={handleConfirm} type="button">Confirm</button>
              <button className="seller-card-action-btn" onClick={handleCancel} type="button">Cancel</button>
            </>
          ) : (
            <>
              {onEdit && (
                <button className="seller-card-action-btn" onClick={onEdit} type="button">Edit</button>
              )}
              {onDelete && (
                <button className="seller-card-action-btn seller-card-action-btn--danger" onClick={handleDeleteClick} type="button">Delete</button>
              )}
            </>
          )}
        </div>
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
git add src/shared/components/sellerCard/
git commit -m "feat: add broker Edit/Delete controls to SellerCard"
```

---

## Task 4: Dashboard broker controls

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `useRouter` from `next/navigation`, `deleteSeller` from `../lib/supabase/sellers`, `onEdit`/`onDelete` props on `SellerCard`
- Produces: updated dashboard — broker sees "New listing" button in header and Edit/Delete on each card; buyers see no change

- [ ] **Step 1: Update `src/app/dashboard/page.tsx`**

Replace the entire file:

```tsx
"use client";

import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "../../shared/components/loader/loader";
import SellerCard from "../../shared/components/sellerCard/sellerCard";
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

  const displaySellers = isBuyer ? sellers.map(sanitizeForBuyer) : sellers;

  const handleDelete = async (id: string) => {
    try {
      await deleteSeller(id);
      setSellers((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Failed to delete listing.');
    }
  };

  return (
    <section className="p-4 sm:p-6 animate-fadeInUp">

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">All Listings</h1>
        {!loading && (
          <span className="text-sm opacity-60 font-medium">
            {sellers.length} {sellers.length === 1 ? 'listing' : 'listings'}
          </span>
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

      {loading && <Loader block />}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && sellers.length === 0 && (
        <p className="opacity-60">No listings available yet.</p>
      )}

      {!loading && !error && sellers.length > 0 && (
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
git commit -m "feat: add broker New listing button and card controls to dashboard"
```

---

## Task 5: `/brokerage` management page

**Files:**
- Modify: `src/app/brokerage/page.tsx`

**Interfaces:**
- Consumes: `getAllSellers`, `deleteSeller` from `../lib/supabase/sellers`, `useAuth`, `useRouter`, `ProtectedRoute`, `Seller` type, `formatMoney` (local), `STATUS_LABEL` (local)
- Produces: broker-only management table page with inline delete confirmation and navigation to create/edit

- [ ] **Step 1: Replace `src/app/brokerage/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { useAuth } from "../utils/isAuth";
import { getAllSellers, deleteSeller } from "../lib/supabase/sellers";
import type { Seller } from "../lib/types";
import Loader from "../../shared/components/loader/loader";
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

  return (
    <section className="p-4 sm:p-6 animate-fadeInUp">

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-3xl font-bold">Listings</h1>
        {!loading && (
          <span className="text-sm opacity-60 font-medium">
            {sellers.length} {sellers.length === 1 ? 'listing' : 'listings'}
          </span>
        )}
        <button
          className="ml-auto text-sm px-4 py-2 rounded-lg border border-white/20 hover:border-white/50 transition-colors"
          onClick={() => router.push('/brokerage/listings/new')}
          type="button"
        >
          New listing
        </button>
      </div>

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

      {!loading && sellers.length > 0 && (
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
              {sellers.map((seller) => (
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
git commit -m "feat: build broker listings management table at /brokerage"
```

---

## Task 6: Create listing page

**Files:**
- Create: `src/app/brokerage/listings/new/page.tsx`

**Interfaces:**
- Consumes: `ListingForm` from `../../../../shared/components/listingForm/listingForm`, `createSellerAsBroker` + `BrokerSellerInput` from `../../../lib/supabase/brokerSellers`, `useRouter`, `ProtectedRoute`, `useAuth`
- Produces: `/brokerage/listings/new` page — broker only; on submit navigates to `/brokerage`

- [ ] **Step 1: Create directory and file**

```bash
mkdir -p src/app/brokerage/listings/new
```

`src/app/brokerage/listings/new/page.tsx`:

```tsx
"use client";

import { redirect, useRouter } from "next/navigation";
import { useAuth } from "../../../utils/isAuth";
import ListingForm from "../../../../shared/components/listingForm/listingForm";
import { createSellerAsBroker } from "../../../lib/supabase/brokerSellers";
import type { BrokerSellerInput } from "../../../lib/supabase/brokerSellers";
import ProtectedRoute from "../../../utils/protectedRoute";

const NewListingPage = () => {
  const { effectiveRole } = useAuth();
  const router = useRouter();

  if (effectiveRole !== 'broker' && effectiveRole !== null) {
    redirect('/inicio');
  }

  const handleSubmit = async (data: BrokerSellerInput) => {
    await createSellerAsBroker(data);
    router.push('/brokerage');
  };

  return (
    <section className="p-4 sm:p-6 animate-fadeInUp">
      <h1 className="text-3xl font-bold mb-6">New listing</h1>
      <ListingForm
        submitLabel="Create listing"
        onSubmit={handleSubmit}
        onCancel={() => router.push('/brokerage')}
      />
    </section>
  );
};

export default ProtectedRoute(NewListingPage);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/brokerage/listings/new/page.tsx
git commit -m "feat: add /brokerage/listings/new create listing page"
```

---

## Task 7: Edit listing page

**Files:**
- Create: `src/app/brokerage/listings/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: `ListingForm` from `../../../../../shared/components/listingForm/listingForm`, `getSellerById`, `updateSeller` from `../../../../lib/supabase/sellers`, `BrokerSellerInput` from `../../../../lib/supabase/brokerSellers`, `useRouter`, `ProtectedRoute`, `useAuth`, `Loader`
- Produces: `/brokerage/listings/[id]/edit` page — fetches seller on mount, pre-fills form, on submit navigates to `/brokerage`

- [ ] **Step 1: Create directory and file**

```bash
mkdir -p "src/app/brokerage/listings/[id]/edit"
```

`src/app/brokerage/listings/[id]/edit/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { useAuth } from "../../../../utils/isAuth";
import { getSellerById, updateSeller } from "../../../../lib/supabase/sellers";
import type { Seller } from "../../../../lib/types";
import type { BrokerSellerInput } from "../../../../lib/supabase/brokerSellers";
import ListingForm from "../../../../../shared/components/listingForm/listingForm";
import Loader from "../../../../../shared/components/loader/loader";
import ProtectedRoute from "../../../../utils/protectedRoute";

const EditListingPage = ({ params }: { params: { id: string } }) => {
  const { effectiveRole } = useAuth();
  const router = useRouter();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  if (effectiveRole !== 'broker' && effectiveRole !== null) {
    redirect('/inicio');
  }

  useEffect(() => {
    getSellerById(params.id)
      .then(setSeller)
      .catch(() => setFetchError('Listing not found.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (data: BrokerSellerInput) => {
    await updateSeller(params.id, data);
    router.push('/brokerage');
  };

  if (loading) return <Loader block />;
  if (fetchError || !seller) return <p className="p-6 text-red-400">{fetchError ?? 'Listing not found.'}</p>;

  return (
    <section className="p-4 sm:p-6 animate-fadeInUp">
      <h1 className="text-3xl font-bold mb-6">Edit listing</h1>
      <ListingForm
        initialValues={{
          company_name: seller.company_name,
          annual_revenue: seller.annual_revenue ?? undefined,
          ebitda: seller.ebitda ?? undefined,
          asking_price: seller.asking_price,
          state: seller.state ?? undefined,
          employee_count: seller.employee_count ?? undefined,
          years_in_business: seller.years_in_business ?? undefined,
          business_type: seller.business_type ?? undefined,
          work_type: seller.work_type ?? undefined,
          software: seller.software ?? undefined,
          management_type: seller.management_type ?? undefined,
          status: seller.status,
          phone: seller.phone,
          website: seller.website,
        }}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => router.push('/brokerage')}
      />
    </section>
  );
};

export default ProtectedRoute(EditListingPage);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/brokerage/listings/[id]/edit/page.tsx"
git commit -m "feat: add /brokerage/listings/[id]/edit page"
```

---

## Self-Review

**Spec coverage:**
- §1 Data layer → Task 1 ✓
- §2 ListingForm → Task 2 ✓
- §3 Dashboard broker controls → Task 4 ✓ (SellerCard props → Task 3 ✓)
- §4 /brokerage management page → Task 5 ✓
- §5 Create page → Task 6 ✓
- §6 Edit page → Task 7 ✓

**Type consistency:**
- `BrokerSellerInput` defined in Task 1, imported correctly in Tasks 2, 6, 7 ✓
- `onEdit`/`onDelete` defined in Task 3, passed in Task 4 ✓
- `createSellerAsBroker` defined in Task 1, called in Task 6 ✓
- `getSellerById` / `updateSeller` already exist in `sellers.ts`, called in Task 7 ✓

**No placeholders:** All steps have full code. ✓
