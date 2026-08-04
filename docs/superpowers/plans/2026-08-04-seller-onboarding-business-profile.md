# Seller Onboarding Business Profile Expansion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the seller onboarding "Almost done" form to collect all missing `Seller` fields required for Sprint 2 matching: `state`, `employee_count`, `years_in_business`, `business_type`, `work_type`, `software`, `management_type`.

**Architecture:** Two-file change — update the data layer (`sellers.ts`) first so the type contract is established, then update the UI form (`page.tsx`) to match. SCSS additions go into the existing `onboarding.scss`. No DB migrations needed — all target columns already exist in the `sellers` table.

**Tech Stack:** Next.js 15 App Router, TypeScript, SCSS, Supabase

## Global Constraints

- All new fields are required at submit time — `isFormValid` must enforce this.
- `asking_price` is explicitly NOT collected here — deferred to a future seller profile edit flow.
- Use existing types from `src/app/lib/types.ts`: `BusinessType`, `WorkType`, `ManagementType`.
- Use `US_STATES` from `src/app/lib/data/usStates.ts` for the state dropdown — do not hardcode state lists.
- Follow existing SCSS naming: seller form uses `.seller-onboarding-*` prefix.
- Radio button style pattern: mirror the buyer wizard's `.buyer-radio-btn` pattern but under `.seller-*` class names.
- No new dependencies — use only what already exists in the project.

---

### Task 1: Extend the data layer

**Files:**
- Modify: `src/app/lib/supabase/sellers.ts`

**Interfaces:**
- Produces: `SellerProfileData` with 7 new required fields; `createSellerProfile` inserts them.

- [ ] **Step 1: Update `SellerProfileData` interface**

In `sellers.ts`, replace the existing `SellerProfileData` interface:

```typescript
export interface SellerProfileData {
  company_name: string;
  annual_revenue: number;
  ebitda: number;
  phone: string | null;
  website: string | null;
  state: string;
  employee_count: number;
  years_in_business: number;
  business_type: import('../types').BusinessType;
  work_type: import('../types').WorkType;
  software: string;
  management_type: import('../types').ManagementType;
}
```

- [ ] **Step 2: Update `createSellerProfile` insert payload**

In `createSellerProfile`, update the insert object to include all new fields:

```typescript
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
    state: data.state,
    employee_count: data.employee_count,
    years_in_business: data.years_in_business,
    business_type: data.business_type,
    work_type: data.work_type,
    software: data.software,
    management_type: data.management_type,
  })
  .select()
  .single();
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors on `sellers.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/app/lib/supabase/sellers.ts
git commit -m "feat: extend SellerProfileData with business profile fields"
```

---

### Task 2: Add SCSS for new field types

**Files:**
- Modify: `src/app/seller/onboarding/onboarding.scss`

**Interfaces:**
- Produces: `.seller-onboarding-field-row`, `.seller-onboarding-radio-group`, `.seller-onboarding-radio-btn`, `.seller-onboarding-select` classes used in Task 3.

- [ ] **Step 1: Add new SCSS classes to `onboarding.scss`**

Append the following to the end of `src/app/seller/onboarding/onboarding.scss`:

```scss
.seller-onboarding-field-row {
  display: flex;
  gap: 1rem;

  > .seller-onboarding-field {
    flex: 1;
  }
}

.seller-onboarding-select {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--estora-white, #fafafa);
  font-size: 0.95rem;
  cursor: pointer;
  appearance: none;

  option {
    background: #1a1a2e;
    color: var(--estora-white, #fafafa);
  }

  &:focus {
    outline: none;
    border-color: var(--estora-primary, #4A6FA5);
  }
}

.seller-onboarding-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.seller-onboarding-radio-btn {
  padding: 0.4rem 0.9rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: var(--estora-white, #fafafa);
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
  text-transform: capitalize;

  &:hover:not(.seller-onboarding-radio-btn--selected) {
    border-color: rgba(255, 255, 255, 0.4);
  }

  &--selected {
    border-color: var(--estora-primary, #4A6FA5);
    background: rgba(74, 111, 165, 0.2);
    font-weight: 600;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/seller/onboarding/onboarding.scss
git commit -m "style: add seller onboarding radio and field-row classes"
```

---

### Task 3: Expand the onboarding form

**Files:**
- Modify: `src/app/seller/onboarding/page.tsx`

**Interfaces:**
- Consumes: `SellerProfileData` (from Task 1) — `createSellerProfile` now requires `state`, `employee_count`, `years_in_business`, `business_type`, `work_type`, `software`, `management_type`.
- Consumes: SCSS classes from Task 2 — `.seller-onboarding-field-row`, `.seller-onboarding-radio-group`, `.seller-onboarding-radio-btn`, `.seller-onboarding-select`.
- Consumes: `US_STATES` from `../../lib/data/usStates` — array of `{ code: string; label: string }`.
- Consumes: `BusinessType`, `WorkType`, `ManagementType` from `../../lib/types`.

- [ ] **Step 1: Update imports at top of `page.tsx`**

Add to existing imports:

```typescript
import { US_STATES } from "../../lib/data/usStates";
import type { BusinessType, WorkType, ManagementType } from "../../lib/types";
```

- [ ] **Step 2: Expand `BusinessFormData` interface**

Replace the existing `BusinessFormData` interface:

```typescript
interface BusinessFormData {
  company_name: string;
  annual_revenue: string;
  ebitda: string;
  phone: string;
  website: string;
  state: string;
  employee_count: string;
  years_in_business: string;
  business_type: BusinessType | "";
  work_type: WorkType | "";
  software: string;
  management_type: ManagementType | "";
}
```

- [ ] **Step 3: Update `form` initial state**

Replace the `useState<BusinessFormData>` initial value:

```typescript
const [form, setForm] = useState<BusinessFormData>({
  company_name: '',
  annual_revenue: '',
  ebitda: '',
  phone: '',
  website: '',
  state: '',
  employee_count: '',
  years_in_business: '',
  business_type: '',
  work_type: '',
  software: '',
  management_type: '',
});
```

- [ ] **Step 4: Update `isFormValid`**

Replace the existing `isFormValid` declaration:

```typescript
const isFormValid =
  form.company_name.trim() !== '' &&
  !isNaN(parseFloat(form.annual_revenue)) && parseFloat(form.annual_revenue) >= 0 &&
  !isNaN(parseFloat(form.ebitda)) && parseFloat(form.ebitda) >= 0 &&
  form.state !== '' &&
  !isNaN(parseInt(form.employee_count, 10)) && parseInt(form.employee_count, 10) >= 1 &&
  !isNaN(parseInt(form.years_in_business, 10)) && parseInt(form.years_in_business, 10) >= 0 &&
  form.business_type !== '' &&
  form.work_type !== '' &&
  form.software.trim() !== '' &&
  form.management_type !== '';
```

- [ ] **Step 5: Update `handleBusinessSubmit` to pass new fields**

Replace the `createSellerProfile` call inside `handleBusinessSubmit`:

```typescript
await createSellerProfile({
  company_name: form.company_name,
  annual_revenue: parseFloat(form.annual_revenue) * 1_000_000,
  ebitda: parseFloat(form.ebitda) * 100_000,
  phone: form.phone || null,
  website: form.website || null,
  state: form.state,
  employee_count: parseInt(form.employee_count, 10),
  years_in_business: parseInt(form.years_in_business, 10),
  business_type: form.business_type as BusinessType,
  work_type: form.work_type as WorkType,
  software: form.software.trim(),
  management_type: form.management_type as ManagementType,
});
```

- [ ] **Step 6: Replace the form JSX**

In the `step === TOTAL_CATEGORIES + 1` branch, replace the entire `<form>` element's contents with the full expanded set of fields in this order. The outer `<form>` tag and `handleBusinessSubmit`/`className` stay the same — only the inner fields change:

```tsx
{/* Company name */}
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

{/* Revenue */}
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

{/* EBITDA */}
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

{/* State */}
<div className="seller-onboarding-field">
  <label htmlFor="state">State *</label>
  <select
    id="state"
    name="state"
    className="seller-onboarding-select"
    value={form.state}
    onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
    required
    disabled={submitLoading}
  >
    <option value="">Select a state...</option>
    {US_STATES.map((s) => (
      <option key={s.code} value={s.code}>{s.label}</option>
    ))}
  </select>
</div>

{/* Employee count + Years in business */}
<div className="seller-onboarding-field-row">
  <div className="seller-onboarding-field">
    <label htmlFor="employee_count">Employees *</label>
    <input
      id="employee_count"
      name="employee_count"
      type="number"
      min="1"
      step="1"
      value={form.employee_count}
      onChange={handleFormChange}
      placeholder="25"
      required
      disabled={submitLoading}
    />
  </div>
  <div className="seller-onboarding-field">
    <label htmlFor="years_in_business">Years in Business *</label>
    <input
      id="years_in_business"
      name="years_in_business"
      type="number"
      min="0"
      step="1"
      value={form.years_in_business}
      onChange={handleFormChange}
      placeholder="8"
      required
      disabled={submitLoading}
    />
  </div>
</div>

{/* Business type */}
<div className="seller-onboarding-field">
  <label>Business Type *</label>
  <div className="seller-onboarding-radio-group">
    {(["residential", "commercial", "both"] as BusinessType[]).map((opt) => (
      <button
        key={opt}
        type="button"
        className={`seller-onboarding-radio-btn${form.business_type === opt ? " seller-onboarding-radio-btn--selected" : ""}`}
        onClick={() => setForm((prev) => ({ ...prev, business_type: opt }))}
        disabled={submitLoading}
      >
        {opt}
      </button>
    ))}
  </div>
</div>

{/* Work type */}
<div className="seller-onboarding-field">
  <label>Work Type *</label>
  <div className="seller-onboarding-radio-group">
    {(["retail", "insurance", "both"] as WorkType[]).map((opt) => (
      <button
        key={opt}
        type="button"
        className={`seller-onboarding-radio-btn${form.work_type === opt ? " seller-onboarding-radio-btn--selected" : ""}`}
        onClick={() => setForm((prev) => ({ ...prev, work_type: opt }))}
        disabled={submitLoading}
      >
        {opt}
      </button>
    ))}
  </div>
</div>

{/* Software */}
<div className="seller-onboarding-field">
  <label htmlFor="software">Field Management Software *</label>
  <input
    id="software"
    name="software"
    type="text"
    value={form.software}
    onChange={handleFormChange}
    placeholder="Jobber, AccuLynx, ServiceTitan..."
    required
    disabled={submitLoading}
  />
</div>

{/* Management type */}
<div className="seller-onboarding-field">
  <label>Management Structure *</label>
  <div className="seller-onboarding-radio-group">
    {(["owner_operated", "has_management_team"] as ManagementType[]).map((opt) => (
      <button
        key={opt}
        type="button"
        className={`seller-onboarding-radio-btn${form.management_type === opt ? " seller-onboarding-radio-btn--selected" : ""}`}
        onClick={() => setForm((prev) => ({ ...prev, management_type: opt }))}
        disabled={submitLoading}
      >
        {opt.replace(/_/g, " ")}
      </button>
    ))}
  </div>
</div>

{/* Phone (optional) */}
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

{/* Website (optional) */}
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
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 8: Start dev server and test the form manually**

```bash
npm run dev
```

Walk through the seller onboarding as a logged-in seller:
- Complete the assessment steps
- On the "Almost done" screen verify all new fields appear in the correct order
- Verify "View my results →" button stays disabled until all required fields are filled
- Verify radio buttons highlight on click (business_type, work_type, management_type)
- Verify state dropdown lists all US states
- Submit and confirm no console errors; confirm redirect to AssessmentResults screen

- [ ] **Step 9: Commit**

```bash
git add src/app/seller/onboarding/page.tsx
git commit -m "feat: expand seller onboarding to collect full business profile"
```
