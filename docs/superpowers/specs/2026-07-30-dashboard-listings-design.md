# Dashboard — All Listings View + Debug Panel

**Date:** 2026-07-30  
**Status:** Approved  
**Sprint:** 1.5 (pre-Sprint 2 marketplace)

---

## Goal

Build a `/dashboard` route that shows all seller listings. The broker sees full data. A simulated buyer role (via Debug Panel) sees only `annual_revenue` in clear; all other fields are replaced with generic dummy values before render AND visually blurred on top, so removing CSS in DevTools reveals nothing real.

---

## 1. Route & Access Control

**File:** `src/app/dashboard/page.tsx`

- Wrapped in `ProtectedRoute` (handles unauthenticated → redirect `/`).
- Secondary role guard inside the page component:
  - `effectiveRole === 'broker'` → full data render
  - `effectiveRole === 'buyer'` → sanitized + blurred render
  - `effectiveRole === 'seller'` or `'pending'` → redirect `/inicio`
- Fetches `getAllSellers()` in a `useEffect` on mount. Local state: `sellers: Seller[]`, `loading: boolean`, `error: string | null`.
- Shows `<Loader block />` during fetch, inline error message on failure.

**Menu link:** `src/shared/components/menu/menu.tsx` — add "Dashboard" `<Link href="/dashboard">` rendered only when `effectiveRole === 'broker'`.

---

## 2. Role Override System

**Modified file:** `src/app/utils/isAuth.tsx`

Add two fields to `AuthContextType`:
- `effectiveRole: Role | null` — the active role (debug override ?? real role)
- `setDebugRole: (role: Role | null) => void` — called by Debug Panel

Inside `AuthProvider`:
- `const [debugRole, setDebugRole] = useState<Role | null>(null)`
- On mount (`useEffect` with `[]`): read `localStorage.getItem('debug_role')` and call `setDebugRole` if set.
- `effectiveRole = debugRole ?? role`
- `setDebugRole` also writes to `localStorage` (or clears it on `null`).
- Expose `effectiveRole` and `setDebugRole` via context.

All role-aware consumers (`ProtectedRoute`, `menu.tsx`, `dashboard/page.tsx`) switch from `role` to `effectiveRole`.

---

## 3. Data Sanitization

**New file:** `src/app/lib/utils/sanitize.ts`

```ts
export function sanitizeForBuyer(seller: Seller, index: number): Seller {
  return {
    ...seller,
    company_name: `Roofing Business #${index + 1}`,
    state: null,
    ebitda: null,
    ebitda_margin: null,
    asking_price: null,
    employee_count: null,
    years_in_business: null,
    business_type: null,
    work_type: null,
    software: null,
    management_type: null,
    // annual_revenue intentionally kept real
  };
}
```

Called in `dashboard/page.tsx` before passing data to cards:
```ts
const displaySellers = effectiveRole === 'buyer'
  ? sellers.map(sanitizeForBuyer)
  : sellers;
```

Real data never enters the buyer-mode DOM.

---

## 4. SellerCard Component

**New file:** `src/shared/components/sellerCard/sellerCard.tsx`  
**New file:** `src/shared/components/sellerCard/sellerCard.scss`

Props:
```ts
interface SellerCardProps {
  seller: Seller;
  blurred?: boolean; // true when viewer is buyer
}
```

Layout (card structure):
- **Status badge** — maps `status` to label + color:
  - `active` → "Available" (green)
  - `under_nda` → "Under NDA" (amber)
  - `sold` → "Sold" (gray)
- **Company name** — `<BlurredField>` when `blurred`
- **State** — `<BlurredField>` when `blurred`
- **Annual Revenue** — always visible, formatted as `$4.5M` / `$740K`
- **EBITDA** — `<BlurredField>` when `blurred`
- **Asking Price** — `<BlurredField>` when `blurred`
- **Business type + Work type chips** — `<BlurredField>` when `blurred`
- **Years in business + Employee count** — `<BlurredField>` when `blurred`

`BlurredField` is an inline wrapper component within the file:
```tsx
const BlurredField = ({ children, active }: { children: React.ReactNode; active: boolean }) =>
  active ? (
    <span className="blur-field select-none" style={{ filter: 'blur(5px)', pointerEvents: 'none' }}>
      {children}
    </span>
  ) : <>{children}</>;
```

Since the data passed to the card is already sanitized (generic values), the blur is purely visual — DevTools removal exposes only `"Roofing Business #1"` etc.

---

## 5. Dashboard Page Layout

**File:** `src/app/dashboard/page.tsx`

```
[Header: "All Listings" h1 + count badge]
[Buyer mode notice banner — only shown when effectiveRole === 'buyer']
[Grid: grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4]
  [SellerCard × N]
[Empty state if sellers.length === 0]
```

The buyer notice banner reads: *"You're viewing anonymized listings. Request access to unlock full details."*

---

## 6. Debug Panel

**New file:** `src/shared/components/debugPanel/debugPanel.tsx`

- Fixed position: `bottom-4 right-4 z-50`
- Always visible (no environment gate — it's for test simulation)
- Shows: `"Role: broker"` (color-coded badge)
- Three buttons: `Broker` | `Buyer` | `Seller` — active button highlighted
- `Reset` button clears override (`setDebugRole(null)` + removes localStorage key)
- Uses `setDebugRole` from `useAuth()`
- Mounted directly in `src/app/layout.tsx` inside `<AuthProvider>` after `<Footer />`

---

## 7. Seed Data

**New file:** `supabase/seed/sellers_dummy.sql`

Five `INSERT` statements based on the five listings at theroofingbizbroker.com/all-listings/:

| # | company_name | state | annual_revenue | ebitda | status |
|---|---|---|---|---|---|
| 1 | Texas High-Growth Roofing Co. | TX | 4,500,000 | 1,200,000 | active |
| 2 | California Family Roofing Contractor | CA | 3,200,000 | 780,000 | active |
| 3 | South Florida Commercial Roofing | FL | 7,900,000 | 2,100,000 | under_nda |
| 4 | S. Florida Residential Platform | FL | 7,100,000 | 740,000 | active |
| 5 | North Carolina Roofing Company | NC | 13,200,000 | 2,600,000 | active |

`profile_id` uses a placeholder UUID (`00000000-0000-0000-0000-000000000001`) — update to real broker UUID before running. The SQL file includes a comment block with instructions.

---

## 8. Files Changed / Created

**New:**
- `src/app/dashboard/page.tsx`
- `src/shared/components/sellerCard/sellerCard.tsx`
- `src/shared/components/sellerCard/sellerCard.scss`
- `src/shared/components/debugPanel/debugPanel.tsx`
- `src/app/lib/utils/sanitize.ts`
- `supabase/seed/sellers_dummy.sql`

**Modified:**
- `src/app/utils/isAuth.tsx` — add `effectiveRole`, `setDebugRole` to context
- `src/app/utils/protectedRoute.tsx` — use `effectiveRole` instead of `role`
- `src/shared/components/menu/menu.tsx` — Dashboard link for broker + use `effectiveRole`
- `src/app/layout.tsx` — mount `<DebugPanel />`

---

## Out of Scope

- Server-side RLS enforcement for buyer anonymization (Sprint 2)
- Filters / search on the dashboard (post real-data sprint)
- Buyer marketplace route (Sprint 2)
- Seller detail page / CIM access flow (deferred)
