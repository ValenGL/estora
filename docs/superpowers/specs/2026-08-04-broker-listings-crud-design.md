# Broker Listings CRUD — Sprint 4

**Date:** 2026-08-04
**Status:** Approved
**Sprint:** 4 — Broker Listings Management

---

## Goal

Give the broker full create / edit / delete control over seller listings from two surfaces: the buyer-facing `/dashboard` (contextual controls per card) and a dedicated `/brokerage` management page (table view). Buyers are never exposed to these controls.

---

## 1. Data Layer

**New file:** `src/app/lib/supabase/brokerSellers.ts`

### `createSellerAsBroker`

```ts
createSellerAsBroker(data: BrokerSellerInput): Promise<Seller>
```

Inserts a new seller row with `profile_id` set to the authenticated broker's user id (`supabase.auth.getUser()`). `BrokerSellerInput` is all editable fields — same as `SellerInput` minus `profile_id`.

### Re-used from `sellers.ts`

- `updateSeller(id, updates)` — already accepts any id, works for broker edits
- `deleteSeller(id)` — same
- `getAllSellers()` — already used by `/dashboard`

**Type:**

```ts
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
```

---

## 2. Shared Listing Form

**New file:** `src/shared/components/listingForm/listingForm.tsx`

A controlled form component used by both create and edit pages. Accepts:

```ts
interface ListingFormProps {
  initialValues?: Partial<BrokerSellerInput>;
  onSubmit: (data: BrokerSellerInput) => Promise<void>;
  submitLabel: string;
}
```

Fields (all required unless noted):
- Company name (text)
- Annual revenue in millions (number, step 0.1)
- EBITDA in hundred-thousands (number, step 0.1)
- Asking price in millions (number, step 0.1, optional)
- State (select from US_STATES)
- Employees (number, min 1)
- Years in business (number, min 0)
- Business type (radio: residential / commercial / both)
- Work type (radio: retail / insurance / both)
- Software (text)
- Management (radio: owner_operated / has_management_team)
- Status (select: active / under_nda / sold / inactive)
- Phone (text, optional)
- Website (url, optional)

Revenue, EBITDA, and asking price are stored in raw USD. The form inputs are in human units (millions / hundred-thousands) and converted on submit — same pattern as the account page.

Validation mirrors `SellerSection.isValid` on the account page, plus asking price ≥ 0 if provided, status required.

---

## 3. Dashboard Broker Controls

**Modified:** `src/app/dashboard/page.tsx`

When `effectiveRole === 'broker'`:

- Header gains a **"New listing"** button (right side, ghost style) that navigates to `/brokerage/listings/new`
- `SellerCard` receives two optional props: `onEdit?: () => void` and `onDelete?: () => void`
- When these props are present the card renders an action row at the bottom with Edit and Delete buttons
- Delete shows an inline confirmation state on the card ("Delete this listing?" + Confirm / Cancel) before calling `deleteSeller(id)` and removing the card from local state

Buyers see no changes — `onEdit` and `onDelete` are only passed when role is broker.

---

## 4. `/brokerage` Management Page

**Modified:** `src/app/brokerage/page.tsx`

Replaces or builds on the existing empty stub at that route.

Layout:
- Page header: "Listings" + count + "New listing" button (navigates to `/brokerage/listings/new`)
- Table with columns: Company, State, Revenue, EBITDA, Status, Actions
- Each row: Edit button (navigates to `/brokerage/listings/[id]/edit`) + Delete button (inline confirmation, same pattern as dashboard)
- Revenue and EBITDA formatted with `formatMoney`
- Status shown as a badge (same STATUS_LABEL map as SellerCard)
- Empty state: "No listings yet." with a "Create your first listing" link

Broker-only route — redirect to `/inicio` for any other role.

---

## 5. Create Page — `/brokerage/listings/new`

**New file:** `src/app/brokerage/listings/new/page.tsx`

- Renders `ListingForm` with no initial values and `submitLabel="Create listing"`
- On submit: calls `createSellerAsBroker(data)`, then navigates to `/brokerage`
- On cancel: navigates back to `/brokerage`
- Broker-only route

---

## 6. Edit Page — `/brokerage/listings/[id]/edit`

**New file:** `src/app/brokerage/listings/[id]/edit/page.tsx`

- Fetches seller by id (`getSellerById(id)`) on mount
- Renders `ListingForm` with `initialValues` pre-filled and `submitLabel="Save changes"`
- On submit: calls `updateSeller(id, data)`, then navigates to `/brokerage`
- On cancel: navigates back to `/brokerage`
- Broker-only route

---

## 7. Files Changed / Created

**New:**
- `src/app/lib/supabase/brokerSellers.ts`
- `src/shared/components/listingForm/listingForm.tsx`
- `src/app/brokerage/listings/new/page.tsx`
- `src/app/brokerage/listings/[id]/edit/page.tsx`

**Modified:**
- `src/app/dashboard/page.tsx` — broker header button + broker controls on SellerCard
- `src/shared/components/sellerCard/sellerCard.tsx` — optional onEdit / onDelete props + action row
- `src/app/brokerage/page.tsx` — full management table

---

## 8. Out of Scope

- RLS enforcement (scheduled for a future sprint)
- Broker viewing a buyer's profile
- Assigning a seller listing to a specific user account after creation
- Image / document uploads on listings
- Bulk delete
