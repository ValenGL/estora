# Account Page — Role-Aware Profile Edit

**Date:** 2026-08-04
**Status:** Approved
**Sprint:** 3 — Account Edit

---

## Goal

Replace the legacy `/account` page (which reads from the obsolete `users` table) with a role-aware edit page. Sellers can view and edit their business listing. Buyers can view and edit their Buy Box criteria. Both roles see their account email in read-only mode.

---

## 1. Route & Architecture

**File:** `src/app/account/page.tsx` — full replacement of current content.
**New file:** `src/app/account/account.scss` — page-specific styles.

The page is a single client component (`"use client"`). It does NOT create new shared components — `SellerSection` and `BuyerSection` are local functions within `page.tsx`.

**Mount sequence:**
1. Read `role` from `useAuth()`
2. Call `supabase.auth.getUser()` to get the account email
3. If `role === 'seller'` → call `getOwnSeller()`
4. If `role === 'buyer'` → call `getOwnBuyer()`
5. If the role-record returns `null` → show incomplete-profile banner with link to onboarding
6. Otherwise → render read mode

**State:**
```ts
email: string
seller: Seller | null      // only if role === 'seller'
buyer: Buyer | null        // only if role === 'buyer'
loading: boolean
editing: boolean           // toggles between read and edit mode
form: Partial<Seller> | Partial<Buyer>   // edit form state, pre-filled from record
saving: boolean
error: string | null
```

**Edit flow:**
- "Editar" button → `setEditing(true)`, pre-fill `form` from current record
- "Guardar" → call `updateSeller(seller.id, form)` or `updateBuyer(buyer.id, form)` → on success: update local record, `setEditing(false)`
- "Cancelar" → discard `form` changes, `setEditing(false)`

---

## 2. Email Section (both roles)

Rendered above the role-specific section. Always read-only — no edit toggle for this field.

```
Email de la cuenta
valentingonzalezlou@gmail.com
```

Loaded via `supabase.auth.getUser()`. Changing email requires a Supabase confirmation flow that is out of scope for this sprint.

---

## 3. Seller Section

### Read mode fields

- **Nombre del negocio** — `company_name`
- **Revenue anual** — `annual_revenue` formatted as `$4.5M` / `$740K`
- **EBITDA** — `ebitda` formatted as `$1.2M`
- **Estado** — `state` displayed as full label (e.g. `TX → Texas`)
- **Empleados** — `employee_count` (inline with years)
- **Años en el negocio** — `years_in_business` (inline with employee count)
- **Tipo de negocio** — `business_type` chip
- **Tipo de trabajo** — `work_type` chip
- **Tipo de gestión** — `management_type` chip
- **Software** — `software`
- **Teléfono** — `phone` (shown as "—" if null)
- **Website** — `website` (shown as "—" if null)

### Edit mode inputs

Same input types used in `seller/onboarding/page.tsx`:
- Text inputs for `company_name`, `software`, `phone`, `website`
- Number inputs for `annual_revenue`, `ebitda`, `employee_count`, `years_in_business`
  - Revenue and EBITDA entered in millions / hundred-thousands respectively, converted to full USD integers before `updateSeller` call
- Single-select dropdown for `state` — uses `US_STATES` from `src/app/lib/data/usStates.ts`
- Radio groups for `business_type`, `work_type`, `management_type`

**Validation:** All fields except `phone` and `website` are required. "Guardar" is disabled if any required field is empty.

**Save call:** `updateSeller(seller.id, { ...form })` — does NOT modify `status`.

---

## 4. Buyer Section

### Read mode fields

- **Organización** — `organization_name`
- **Revenue objetivo** — `revenue_min` – `revenue_max` formatted as `$Xm – $Ym`
- **EBITDA objetivo** — `ebitda_min` – `ebitda_max` formatted the same
- **Estados objetivo** — `target_states` as a list of chips
- **Tipo de negocio** — `business_type` chip
- **Tipo de trabajo** — `work_type` chip
- **Preferencia de gestión** — `management_preference` chip
- **Empleados objetivo** — `employee_min` – `employee_max`
- **Software preferido** — `preferred_software` (shown as "—" if null)

### Edit mode inputs

Same input types used in `buyer/onboarding/page.tsx`:
- Text input for `organization_name`, `preferred_software`
- Number inputs for revenue/EBITDA/employee ranges
- Multi-select checkboxes for `target_states` — uses `US_STATES`
- Radio groups for `business_type`, `work_type`, `management_preference`

**Validation:** `organization_name` and at least one `target_states` selection are required. All range fields must have max ≥ min when both are set.

**Save call:** `updateBuyer(buyer.id, { ...form })`

---

## 5. Incomplete Profile Banner

Shown when `getOwnSeller()` or `getOwnBuyer()` returns `null`.

```
No tienes un perfil completo.
[Completar perfil →]  (links to /seller/onboarding or /buyer/onboarding)
```

Not shown to `broker` or `pending` roles — those roles are redirected to `/inicio` by `ProtectedRoute` (or handled by existing role guards).

---

## 6. Files Changed / Created

**Replaced:**
- `src/app/account/page.tsx` — full rewrite

**New:**
- `src/app/account/account.scss` — page-specific styles

**Unchanged (data layer already supports all operations):**
- `src/app/lib/supabase/sellers.ts` — `getOwnSeller`, `updateSeller` already exist
- `src/app/lib/supabase/buyers.ts` — `getOwnBuyer`, `updateBuyer` already exist
- `src/app/lib/types.ts` — `Seller`, `Buyer` types already complete

---

## 7. Out of Scope

- Email editing (requires Supabase confirmation flow)
- Username editing
- Broker role view (broker has no `sellers`/`buyers` record)
- `asking_price` field for sellers (deferred to a later flow)
- Seller status change (active/inactive/sold)
- Deleting a listing or Buy Box
