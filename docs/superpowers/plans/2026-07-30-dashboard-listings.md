# Dashboard — All Listings View + Debug Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/dashboard` route with seller listings in full (broker) or anonymized (buyer) mode, plus a floating Debug Panel to simulate roles client-side.

**Architecture:** `useAuth` gains `effectiveRole` (debug override ?? real Supabase role) and `setDebugRole`. The dashboard page fetches all sellers, sanitizes data before render for buyer mode, and passes it to a new `SellerCard` component. The `DebugPanel` is a fixed overlay mounted in `layout.tsx`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase client, SCSS + Tailwind CSS

## Global Constraints

- No test framework is set up — use `npx tsc --noEmit` as the type-check gate after each task.
- All role-aware components must use `effectiveRole` from `useAuth()`, not `role`.
- Real seller data must never enter the DOM when `effectiveRole === 'buyer'` — sanitization happens before render.
- Follow existing patterns: `"use client"` directive, `import "./component.scss"`, Tailwind + `u-bgcolor-estora-*` / `u-color-estora-*` utility classes.
- Color tokens: `estora-white #fafafa`, `estora-dark #166088`, `estora-black #0a1310`, `estora-gray #5d6a66`, `estora-primary #4A6FA5`.
- `Seller` and `Role` types live in `src/app/lib/types.ts` — do not redefine them.

---

### Task 1: Extend `useAuth` with `effectiveRole` and `setDebugRole`

**Files:**
- Modify: `src/app/utils/isAuth.tsx`

**Interfaces:**
- Produces: `useAuth()` now returns `effectiveRole: Role | null` and `setDebugRole: (role: Role | null) => void` in addition to all existing fields. All other tasks consume these two new fields.

- [ ] **Step 1: Add the two new fields to `AuthContextType`**

  Open `src/app/utils/isAuth.tsx`. Replace the `AuthContextType` interface:

  ```tsx
  interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    role: Role | null;
    effectiveRole: Role | null;
    setDebugRole: (role: Role | null) => void;
    refreshRole: () => Promise<void>;
  }
  ```

- [ ] **Step 2: Update the context default value**

  Replace the `createContext` call:

  ```tsx
  const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoggedIn: false,
    isLoading: true,
    role: null,
    effectiveRole: null,
    setDebugRole: () => {},
    refreshRole: async () => {},
  });
  ```

- [ ] **Step 3: Add `debugRole` state and `setDebugRole` to `AuthProvider`**

  Inside `AuthProvider`, after the existing `const [role, setRole] = useState<Role | null>(null);` line, add:

  ```tsx
  const [debugRole, setDebugRoleState] = useState<Role | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('debug_role') as Role | null;
    if (stored) setDebugRoleState(stored);
  }, []);

  const setDebugRole = useCallback((newRole: Role | null) => {
    setDebugRoleState(newRole);
    if (newRole === null) {
      localStorage.removeItem('debug_role');
    } else {
      localStorage.setItem('debug_role', newRole);
    }
  }, []);

  const effectiveRole = debugRole ?? role;
  ```

  `useCallback` is already imported. `useEffect` is already imported.

- [ ] **Step 4: Expose the new values through the context Provider**

  Replace the `<AuthContext.Provider value={...}>` line:

  ```tsx
  <AuthContext.Provider value={{ user, isLoggedIn, isLoading, role, effectiveRole, setDebugRole, refreshRole }}>
    {children}
  </AuthContext.Provider>
  ```

- [ ] **Step 5: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors. If `useCallback` import is missing, add it alongside the existing React imports.

- [ ] **Step 6: Commit**

  ```bash
  git add src/app/utils/isAuth.tsx
  git commit -m "feat: add effectiveRole and setDebugRole to AuthContext"
  ```

---

### Task 2: Update `ProtectedRoute` to use `effectiveRole`

**Files:**
- Modify: `src/app/utils/protectedRoute.tsx`

**Interfaces:**
- Consumes: `effectiveRole` from `useAuth()` (Task 1)

- [ ] **Step 1: Replace `role` with `effectiveRole` in the guard**

  Open `src/app/utils/protectedRoute.tsx`. Replace the full file content:

  ```tsx
  "use client";

  import { redirect } from "next/navigation";
  import { ComponentType } from "react";
  import { useAuth } from "./isAuth";

  const ProtectedRoute = <P extends object>(Component: ComponentType<P>) => {
    return function WrappedComponent(props: P) {
      const { user, isLoading, effectiveRole } = useAuth();

      if (isLoading) return null;
      if (!user) redirect("/");
      if (effectiveRole === "pending") redirect("/onboarding");

      return <Component {...props} />;
    };
  };

  export default ProtectedRoute;
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/utils/protectedRoute.tsx
  git commit -m "feat: use effectiveRole in ProtectedRoute for debug role support"
  ```

---

### Task 3: Create `sanitize.ts` utility

**Files:**
- Create: `src/app/lib/utils/sanitize.ts`

**Interfaces:**
- Consumes: `Seller` from `src/app/lib/types.ts`
- Produces: `sanitizeForBuyer(seller: Seller, index: number): Seller` — real data replaced with generic values, `annual_revenue` kept intact.

- [ ] **Step 1: Create the utils directory and file**

  Create `src/app/lib/utils/sanitize.ts` with this content:

  ```ts
  import type { Seller } from '../types';

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
      // annual_revenue is intentionally kept real — only visible field for buyers
    };
  }
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors. If `Seller` is missing `asking_price` in `types.ts`, check `src/app/lib/types.ts` — the field might be named differently. The Seller interface currently has `asking_price: number | null`.

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/lib/utils/sanitize.ts
  git commit -m "feat: add sanitizeForBuyer utility to strip real seller data"
  ```

---

### Task 4: Create `SellerCard` component

**Files:**
- Create: `src/shared/components/sellerCard/sellerCard.tsx`
- Create: `src/shared/components/sellerCard/sellerCard.scss`

**Interfaces:**
- Consumes: `Seller` from `src/app/lib/types.ts`
- Produces: `<SellerCard seller={Seller} blurred={boolean} />` — exported default

- [ ] **Step 1: Create the SCSS file**

  Create `src/shared/components/sellerCard/sellerCard.scss`:

  ```scss
  .seller-card {
    transition: transform 0.15s ease, box-shadow 0.15s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }

  .blur-field {
    filter: blur(5px);
    pointer-events: none;
    user-select: none;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;

    &--active {
      background-color: #16a34a;
      color: #fff;
    }

    &--under_nda {
      background-color: #d97706;
      color: #fff;
    }

    &--sold {
      background-color: #6b7280;
      color: #fff;
    }
  }

  .chip {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    background-color: rgba(255, 255, 255, 0.12);
    color: var(--estora-white);
    text-transform: capitalize;
  }
  ```

- [ ] **Step 2: Create the component file**

  Create `src/shared/components/sellerCard/sellerCard.tsx`:

  ```tsx
  "use client";

  import type { Seller } from '../../../app/lib/types';
  import "./sellerCard.scss";

  interface SellerCardProps {
    seller: Seller;
    blurred?: boolean;
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

  export default function SellerCard({ seller, blurred = false }: SellerCardProps) {
    return (
      <div className="seller-card u-bgcolor-estora-black u-color-estora-white rounded-2xl p-4 flex flex-col gap-3 shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)]">

        {/* Status badge */}
        <div>
          <span className={`status-badge status-badge--${seller.status}`}>
            {STATUS_LABEL[seller.status]}
          </span>
        </div>

        {/* Company name */}
        <div>
          <BlurredField active={blurred}>
            <h3 className="text-lg font-semibold leading-tight">
              {seller.company_name}
            </h3>
          </BlurredField>
        </div>

        {/* Revenue (always visible) + State */}
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="opacity-60 text-xs uppercase tracking-wider">Revenue</span>
            <p className="text-base font-bold">{formatMoney(seller.annual_revenue)}</p>
          </div>
          <div className="text-right">
            <span className="opacity-60 text-xs uppercase tracking-wider">State</span>
            <BlurredField active={blurred}>
              <p className="text-base font-bold">{seller.state ?? '——'}</p>
            </BlurredField>
          </div>
        </div>

        {/* EBITDA + Asking price */}
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

        {/* Chips: business type + work type */}
        <BlurredField active={blurred}>
          <div className="flex flex-wrap gap-1">
            {seller.business_type && (
              <span className="chip">{seller.business_type}</span>
            )}
            {seller.work_type && (
              <span className="chip">{seller.work_type}</span>
            )}
          </div>
        </BlurredField>

        {/* Years + Employees */}
        <div className="flex items-center justify-between text-xs opacity-70 pt-1 border-t border-white/10">
          <BlurredField active={blurred}>
            <span>{seller.years_in_business != null ? `${seller.years_in_business} yrs` : '——'}</span>
          </BlurredField>
          <BlurredField active={blurred}>
            <span>{seller.employee_count != null ? `${seller.employee_count} employees` : '——'}</span>
          </BlurredField>
        </div>

      </div>
    );
  }
  ```

- [ ] **Step 3: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors. `Seller['status']` must match the `SellerStatus` type in `types.ts` (`'active' | 'under_nda' | 'sold' | 'inactive'`).

- [ ] **Step 4: Commit**

  ```bash
  git add src/shared/components/sellerCard/
  git commit -m "feat: add SellerCard component with blurred buyer mode"
  ```

---

### Task 5: Create `dashboard/page.tsx`

**Files:**
- Create: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `useAuth()` → `effectiveRole` (Task 1), `getAllSellers()` from `src/app/lib/supabase/sellers.ts`, `sanitizeForBuyer` (Task 3), `SellerCard` (Task 4), `ProtectedRoute` (Task 2), `Loader` from `src/shared/components/loader/loader.tsx`, `Seller` from `src/app/lib/types.ts`

- [ ] **Step 1: Create the page file**

  Create `src/app/dashboard/page.tsx`:

  ```tsx
  "use client";

  import { redirect } from "next/navigation";
  import { useEffect, useState } from "react";
  import Loader from "../../shared/components/loader/loader";
  import SellerCard from "../../shared/components/sellerCard/sellerCard";
  import { getAllSellers } from "../lib/supabase/sellers";
  import type { Seller } from "../lib/types";
  import { sanitizeForBuyer } from "../lib/utils/sanitize";
  import ProtectedRoute from "../utils/protectedRoute";
  import { useAuth } from "../utils/isAuth";

  const DashboardPage = () => {
    const { effectiveRole } = useAuth();
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Role guard: seller and pending roles have no business here
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

    const displaySellers = isBuyer
      ? sellers.map(sanitizeForBuyer)
      : sellers;

    return (
      <section className="p-4 sm:p-6 animate-fadeInUp">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold">All Listings</h1>
          {!loading && (
            <span className="text-sm opacity-60 font-medium">
              {sellers.length} {sellers.length === 1 ? 'listing' : 'listings'}
            </span>
          )}
        </div>

        {/* Buyer notice banner */}
        {isBuyer && (
          <div className="mb-6 p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-sm">
            You are viewing anonymized listings. Request access to unlock full details.
          </div>
        )}

        {/* Loading state */}
        {loading && <Loader block />}

        {/* Error state */}
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {/* Empty state */}
        {!loading && !error && sellers.length === 0 && (
          <p className="opacity-60">No listings available yet.</p>
        )}

        {/* Grid */}
        {!loading && !error && sellers.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displaySellers.map((seller) => (
              <SellerCard
                key={seller.id}
                seller={seller}
                blurred={isBuyer}
              />
            ))}
          </div>
        )}

      </section>
    );
  };

  export default ProtectedRoute(DashboardPage);
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/dashboard/
  git commit -m "feat: add /dashboard route with broker/buyer role-aware listing view"
  ```

---

### Task 6: Update `menu.tsx` with Dashboard link and `effectiveRole`

**Files:**
- Modify: `src/shared/components/menu/menu.tsx`

**Interfaces:**
- Consumes: `effectiveRole` from `useAuth()` (Task 1)

- [ ] **Step 1: Replace `role` destructuring and add Dashboard link**

  Open `src/shared/components/menu/menu.tsx`. Replace the full file content:

  ```tsx
  "use client";

  import Link from "next/link";
  import { usePathname } from "next/navigation";
  import { useState } from "react";
  import { useAuth } from "./../../../app/utils/isAuth";
  import "./menu.scss";

  export default function Menu() {
    const pathname = usePathname();
    const { isLoggedIn, effectiveRole } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
      setIsOpen(!isOpen);
    };

    return (
      <nav className='menu-wrapper select-none'>
        <button className='hamburger' onClick={toggleMenu}>
          ☰
        </button>
        <div
          className={`overlay ${isOpen ? "active" : ""}`}
          onClick={toggleMenu}
        ></div>
        <ul className={isOpen ? "mobile-open" : ""}>
          <button className='close-btn' onClick={toggleMenu}>
            ✕
          </button>
          <li>
            <Link
              className={`link ${pathname === "/" || pathname === "/inicio" ? "active" : ""}`}
              href={isLoggedIn ? "/inicio" : "/"}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
          </li>
          {effectiveRole === 'broker' && (
            <li>
              <Link
                className={`link ${pathname === "/dashboard" ? "active" : ""}`}
                href='/dashboard'
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            </li>
          )}
          <li>
            <Link
              className={`link ${pathname === "/buyer" ? "active" : ""}`}
              href='/buyer'
              onClick={() => setIsOpen(false)}
            >
              Buy
            </Link>
          </li>
          <li>
            <Link
              className={`link ${pathname === "/seller" ? "active" : ""}`}
              href='/seller'
              onClick={() => setIsOpen(false)}
            >
              Sell
            </Link>
          </li>
          <li>
            <Link
              className={`link ${pathname === "/brokerage" ? "active" : ""}`}
              href='/brokerage'
              onClick={() => setIsOpen(false)}
            >
              About Us
            </Link>
          </li>
        </ul>
      </nav>
    );
  }
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/shared/components/menu/menu.tsx
  git commit -m "feat: add Dashboard nav link for broker role"
  ```

---

### Task 7: Create `DebugPanel` component

**Files:**
- Create: `src/shared/components/debugPanel/debugPanel.tsx`

**Interfaces:**
- Consumes: `effectiveRole`, `role`, `setDebugRole` from `useAuth()` (Task 1)
- `Role` type from `src/app/lib/types.ts`

- [ ] **Step 1: Create the component**

  Create `src/shared/components/debugPanel/debugPanel.tsx`:

  ```tsx
  "use client";

  import { useAuth } from "../../../app/utils/isAuth";
  import type { Role } from "../../../app/lib/types";

  const ROLES: Role[] = ['broker', 'buyer', 'seller'];

  const ROLE_COLORS: Record<Role, string> = {
    broker: '#16a34a',
    buyer: '#2563eb',
    seller: '#d97706',
    pending: '#6b7280',
  };

  export default function DebugPanel() {
    const { role, effectiveRole, setDebugRole } = useAuth();
    const isOverriding = effectiveRole !== role;

    return (
      <div
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          zIndex: 9999,
          background: '#0a1310ee',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          minWidth: '160px',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#fafafa',
        }}
      >
        <div style={{ opacity: 0.5, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Debug Panel
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ opacity: 0.6 }}>role:</span>
          <span
            style={{
              background: effectiveRole ? ROLE_COLORS[effectiveRole] : '#6b7280',
              color: '#fff',
              borderRadius: '999px',
              padding: '1px 8px',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            {effectiveRole ?? 'none'}
          </span>
          {isOverriding && (
            <span style={{ opacity: 0.4, fontSize: '9px' }}>(override)</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setDebugRole(r)}
              style={{
                padding: '2px 8px',
                borderRadius: '6px',
                border: effectiveRole === r ? `1.5px solid ${ROLE_COLORS[r]}` : '1px solid rgba(255,255,255,0.2)',
                background: effectiveRole === r ? `${ROLE_COLORS[r]}33` : 'transparent',
                color: '#fafafa',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: effectiveRole === r ? 700 : 400,
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {isOverriding && (
          <button
            onClick={() => setDebugRole(null)}
            style={{
              padding: '2px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '10px',
            }}
          >
            reset
          </button>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/shared/components/debugPanel/debugPanel.tsx
  git commit -m "feat: add DebugPanel component for client-side role simulation"
  ```

---

### Task 8: Mount `DebugPanel` in `layout.tsx`

**Files:**
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `DebugPanel` (Task 7) — must be inside `<AuthProvider>` since it calls `useAuth()`

- [ ] **Step 1: Import and mount DebugPanel**

  Open `src/app/layout.tsx`. Add the import after existing imports:

  ```tsx
  import DebugPanel from "./../shared/components/debugPanel/debugPanel";
  ```

  Then inside `<AuthProvider>`, add `<DebugPanel />` after `<Footer />`:

  ```tsx
  <AuthProvider>
    <Header />
    <main className='main-container container mx-auto select-none'>
      {children}
    </main>
    <Footer />
    <DebugPanel />
  </AuthProvider>
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npx tsc --noEmit
  ```

  Expected: 0 errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/app/layout.tsx
  git commit -m "feat: mount DebugPanel in root layout"
  ```

---

### Task 9: Seed dummy seller data

**Files:**
- Create: `supabase/seed/sellers_dummy.sql`

**Interfaces:**
- None — this is a standalone SQL file run manually in Supabase Studio.

- [ ] **Step 1: Get your broker `profile_id` from Supabase**

  In Supabase Studio → Table Editor → `profiles` table. Find your broker user row and copy its `id` UUID (looks like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`). You will replace `YOUR_BROKER_PROFILE_ID` below with that value.

- [ ] **Step 2: Create the seed file**

  Create `supabase/seed/sellers_dummy.sql`:

  ```sql
  -- Dummy seller listings based on theroofingbizbroker.com/all-listings/
  -- Replace YOUR_BROKER_PROFILE_ID with the broker's actual UUID from the profiles table.
  -- Run once in Supabase Studio → SQL Editor.

  INSERT INTO sellers (
    profile_id, company_name, state,
    annual_revenue, ebitda, ebitda_margin,
    asking_price, employee_count, years_in_business,
    business_type, work_type, status
  ) VALUES
  (
    'YOUR_BROKER_PROFILE_ID',
    'Texas High-Growth Roofing Co.',
    'TX',
    4500000, 1200000, 26.7,
    5400000, 45, 12,
    'both', 'retail', 'active'
  ),
  (
    'YOUR_BROKER_PROFILE_ID',
    'California Family Roofing Contractor',
    'CA',
    3200000, 780000, 24.4,
    3120000, 22, 18,
    'residential', 'retail', 'active'
  ),
  (
    'YOUR_BROKER_PROFILE_ID',
    'South Florida Commercial Roofing',
    'FL',
    7900000, 2100000, 26.6,
    8400000, 65, 15,
    'commercial', 'insurance', 'under_nda'
  ),
  (
    'YOUR_BROKER_PROFILE_ID',
    'S. Florida Residential Platform',
    'FL',
    7100000, 740000, 10.4,
    3700000, 55, 9,
    'residential', 'retail', 'active'
  ),
  (
    'YOUR_BROKER_PROFILE_ID',
    'North Carolina Roofing Company',
    'NC',
    13200000, 2600000, 19.7,
    10400000, 110, 22,
    'both', 'both', 'active'
  );
  ```

- [ ] **Step 3: Run the SQL in Supabase Studio**

  Supabase Studio → SQL Editor → paste the file content (with your real UUID) → Run.

  Expected: 5 rows inserted into the `sellers` table. Verify in Table Editor → `sellers`.

- [ ] **Step 4: Commit the seed file (with placeholder, not your real UUID)**

  ```bash
  git add supabase/seed/sellers_dummy.sql
  git commit -m "seed: add 5 dummy roofing seller listings"
  ```

---

## Verification Checklist

After all tasks are complete, start the dev server (`npm run dev`) and verify:

- [ ] As broker: "Dashboard" link appears in nav. `/dashboard` loads all 5 listings with full data (company name, state, EBITDA, asking price visible).
- [ ] As broker: Debug Panel is visible bottom-right. Switching to "buyer" reloads context.
- [ ] As buyer (via Debug Panel): "Dashboard" link disappears from nav. `/dashboard` shows listings with `annual_revenue` visible, all other fields blurred and showing generic text (`"Roofing Business #1"`, `"——"`, etc.).
- [ ] As buyer: Inspecting DOM in DevTools shows only generic values — no real company names, states, or financial figures in the HTML.
- [ ] As seller (via Debug Panel): navigating to `/dashboard` redirects to `/inicio`.
- [ ] Debug Panel "reset" button clears the override and restores real Supabase role.
- [ ] `npx tsc --noEmit` reports 0 errors.
