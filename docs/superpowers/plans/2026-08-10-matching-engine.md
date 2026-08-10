# Matching Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a broker-only `/brokerage/match` page that lets the broker interactively score and rank buyer-seller compatibility using adjustable weights and configurable dealbreakers.

**Architecture:** All scoring runs client-side in TypeScript via pure functions in `matching.ts`. The page fetches buyers and sellers once on mount; `useMemo` recomputes scores whenever weights, dealbreakers, or the selected anchor change — no round-trips after initial load. No new database tables.

**Tech Stack:** Next.js 15 (App Router), TypeScript, React 18, Supabase client, Tailwind CSS, SCSS, Vitest

## Global Constraints

- All UI text and labels must be in English — no Spanish anywhere.
- All new components go under `src/shared/components/matchView/` and follow the existing BEM-style SCSS pattern (kebab-case class names, `&--modifier` suffixes).
- All new page routes go under `src/app/brokerage/`.
- Broker-only pages must use the `ProtectedRoute` HOC and redirect non-brokers to `/inicio`.
- No new Supabase tables or API routes. All data uses existing `getAllBuyers()` and `getAllSellers()` from `src/app/lib/supabase/`.
- Financial values are in USD. Numeric comparisons use raw values (no unit conversion needed).

---

### Task 1: Setup Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `npm test` command that runs all `*.test.ts` files

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest
```

- [ ] **Step 2: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 3: Add test scripts to package.json**

In `package.json`, add inside `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write a smoke test to verify the setup works**

Create `src/app/lib/utils/matching.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the test**

```bash
npm test
```

Expected: 1 test passes.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json src/app/lib/utils/matching.test.ts
git commit -m "chore: add Vitest for unit testing"
```

---

### Task 2: Add matching types to types.ts

**Files:**
- Modify: `src/app/lib/types.ts`

**Interfaces:**
- Produces:
  - `MatchDimension` — union of 8 scoring dimension keys
  - `MatchWeights` — `Record<MatchDimension, number>` (0–10 per dimension)
  - `SellerMatchResult` — score + breakdown for a seller, used in buyer-first mode
  - `BuyerMatchResult` — score + breakdown for a buyer, used in seller-first mode

- [ ] **Step 1: Append types to `src/app/lib/types.ts`**

Add at the end of the file:
```ts
export type MatchDimension =
  | 'revenue'
  | 'ebitda'
  | 'geography'
  | 'businessType'
  | 'workType'
  | 'employeeCount'
  | 'software'
  | 'managementPreference';

export interface MatchWeights {
  revenue: number;
  ebitda: number;
  geography: number;
  businessType: number;
  workType: number;
  employeeCount: number;
  software: number;
  managementPreference: number;
}

export interface SellerMatchResult {
  seller: Seller;
  score: number | null;
  breakdown: Record<MatchDimension, number | null>;
}

export interface BuyerMatchResult {
  buyer: Buyer;
  score: number | null;
  breakdown: Record<MatchDimension, number | null>;
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/types.ts
git commit -m "feat: add matching engine types"
```

---

### Task 3: Implement scoring engine (TDD)

**Files:**
- Create: `src/app/lib/utils/matching.ts`
- Modify: `src/app/lib/utils/matching.test.ts`

**Interfaces:**
- Consumes: `Buyer`, `Seller`, `MatchDimension`, `MatchWeights`, `SellerMatchResult`, `BuyerMatchResult` from `../types`
- Produces (exported from `matching.ts`):
  - `DEFAULT_WEIGHTS: MatchWeights` — all dimensions at 5
  - `DIMENSION_LABELS: Record<MatchDimension, string>` — human-readable labels
  - `scoreRange(value: number | null, min: number | null, max: number | null): number | null`
  - `scoreGeography(sellerState: string | null, targetStates: string[] | null): number | null`
  - `scoreBusinessType(sellerType: BusinessType | null, buyerType: BuyerBusinessType | null): number | null`
  - `scoreWorkType(sellerType: WorkType | null, buyerType: BuyerWorkType | null): number | null`
  - `scoreSoftware(sellerSoftware: string | null, buyerSoftware: string | null): number | null`
  - `scoreManagement(sellerType: ManagementType | null, buyerPref: ManagementPreference | null): number | null`
  - `scorePair(buyer: Buyer, seller: Seller, weights: MatchWeights, dealbreakers: Set<MatchDimension>): { score: number | null; breakdown: Record<MatchDimension, number | null> }`
  - `scoreAllSellers(buyer: Buyer, sellers: Seller[], weights: MatchWeights, dealbreakers: Set<MatchDimension>): SellerMatchResult[]`
  - `scoreAllBuyers(seller: Seller, buyers: Buyer[], weights: MatchWeights, dealbreakers: Set<MatchDimension>): BuyerMatchResult[]`

- [ ] **Step 1: Write failing tests for `scoreRange`**

Replace `src/app/lib/utils/matching.test.ts` with:
```ts
import { describe, it, expect } from 'vitest';
import {
  scoreRange,
  scoreGeography,
  scoreBusinessType,
  scoreWorkType,
  scoreSoftware,
  scoreManagement,
  scorePair,
  scoreAllSellers,
  scoreAllBuyers,
  DEFAULT_WEIGHTS,
} from './matching';
import type { Buyer, Seller, MatchWeights } from '../types';

// ── Minimal stubs ────────────────────────────────────────────────
const baseSeller: Seller = {
  id: 's1', profile_id: 'p1', company_name: 'Roof Co', status: 'active',
  state: 'TX', annual_revenue: 1_500_000, ebitda: 300_000, ebitda_margin: 20,
  employee_count: 15, years_in_business: 8, business_type: 'residential',
  work_type: 'retail', software: 'AccuLynx', management_type: 'owner_operated',
  asking_price: 1_200_000, phone: null, website: null,
  created_at: '', updated_at: '',
};

const baseBuyer: Buyer = {
  id: 'b1', profile_id: 'p2', organization_name: 'Acquire Inc',
  revenue_min: 1_000_000, revenue_max: 2_000_000,
  ebitda_min: 200_000, ebitda_max: 500_000,
  target_states: ['TX', 'FL'], business_type: 'residential',
  work_type: 'retail', employee_min: 10, employee_max: 25,
  preferred_software: 'acculynx', management_preference: 'owner_operated',
  created_at: '', updated_at: '',
};

// ── scoreRange ───────────────────────────────────────────────────
describe('scoreRange', () => {
  it('returns 1.0 when value is inside range', () => {
    expect(scoreRange(1_500_000, 1_000_000, 2_000_000)).toBe(1.0);
  });

  it('returns 1.0 when value equals min boundary', () => {
    expect(scoreRange(1_000_000, 1_000_000, 2_000_000)).toBe(1.0);
  });

  it('returns 1.0 when value equals max boundary', () => {
    expect(scoreRange(2_000_000, 1_000_000, 2_000_000)).toBe(1.0);
  });

  it('returns 0.5 when value is below min but within 20% of min', () => {
    // min=1_000_000, 20% tolerance = 200_000, so 900_000 is within tolerance
    expect(scoreRange(900_000, 1_000_000, 2_000_000)).toBe(0.5);
  });

  it('returns 0.0 when value is below min and beyond 20% tolerance', () => {
    // 700_000 is 300_000 below min, tolerance is 200_000
    expect(scoreRange(700_000, 1_000_000, 2_000_000)).toBe(0.0);
  });

  it('returns 0.5 when value is above max but within 20% of max', () => {
    // max=2_000_000, 20% tolerance = 400_000, so 2_300_000 is within tolerance
    expect(scoreRange(2_300_000, 1_000_000, 2_000_000)).toBe(0.5);
  });

  it('returns 0.0 when value is above max and beyond 20% tolerance', () => {
    // 2_500_000 is 500_000 above max, tolerance is 400_000
    expect(scoreRange(2_500_000, 1_000_000, 2_000_000)).toBe(0.0);
  });

  it('returns null when both min and max are null (buyer has no criterion)', () => {
    expect(scoreRange(1_500_000, null, null)).toBeNull();
  });

  it('returns 0.5 when value is null (seller field missing)', () => {
    expect(scoreRange(null, 1_000_000, 2_000_000)).toBe(0.5);
  });

  it('treats null max as no upper bound', () => {
    // min only: value above min → 1.0
    expect(scoreRange(5_000_000, 1_000_000, null)).toBe(1.0);
  });

  it('treats null min as 0', () => {
    // max only: value below max → 1.0
    expect(scoreRange(500_000, null, 1_000_000)).toBe(1.0);
  });
});

// ── scoreGeography ───────────────────────────────────────────────
describe('scoreGeography', () => {
  it('returns 1.0 when seller state is in target states', () => {
    expect(scoreGeography('TX', ['TX', 'FL'])).toBe(1.0);
  });

  it('returns 0.0 when seller state is not in target states', () => {
    expect(scoreGeography('CA', ['TX', 'FL'])).toBe(0.0);
  });

  it('returns null when target states is null', () => {
    expect(scoreGeography('TX', null)).toBeNull();
  });

  it('returns null when target states is empty', () => {
    expect(scoreGeography('TX', [])).toBeNull();
  });

  it('returns 0.5 when seller state is null', () => {
    expect(scoreGeography(null, ['TX', 'FL'])).toBe(0.5);
  });
});

// ── scoreBusinessType ────────────────────────────────────────────
describe('scoreBusinessType', () => {
  it('returns 1.0 when buyer is any', () => {
    expect(scoreBusinessType('residential', 'any')).toBe(1.0);
  });

  it('returns 1.0 when buyer is both', () => {
    expect(scoreBusinessType('commercial', 'both')).toBe(1.0);
  });

  it('returns 1.0 on exact match', () => {
    expect(scoreBusinessType('residential', 'residential')).toBe(1.0);
  });

  it('returns 1.0 when seller is both (has overlap with any specific buyer type)', () => {
    expect(scoreBusinessType('both', 'residential')).toBe(1.0);
  });

  it('returns 0.0 on mismatch', () => {
    expect(scoreBusinessType('residential', 'commercial')).toBe(0.0);
  });

  it('returns null when buyer type is null', () => {
    expect(scoreBusinessType('residential', null)).toBeNull();
  });

  it('returns 0.5 when seller type is null', () => {
    expect(scoreBusinessType(null, 'residential')).toBe(0.5);
  });
});

// ── scoreWorkType ────────────────────────────────────────────────
describe('scoreWorkType', () => {
  it('returns 1.0 when buyer is any', () => {
    expect(scoreWorkType('retail', 'any')).toBe(1.0);
  });

  it('returns 1.0 when buyer is both', () => {
    expect(scoreWorkType('insurance', 'both')).toBe(1.0);
  });

  it('returns 1.0 on exact match', () => {
    expect(scoreWorkType('retail', 'retail')).toBe(1.0);
  });

  it('returns 1.0 when seller is both', () => {
    expect(scoreWorkType('both', 'retail')).toBe(1.0);
  });

  it('returns 0.0 on mismatch', () => {
    expect(scoreWorkType('retail', 'insurance')).toBe(0.0);
  });

  it('returns null when buyer type is null', () => {
    expect(scoreWorkType('retail', null)).toBeNull();
  });

  it('returns 0.5 when seller type is null', () => {
    expect(scoreWorkType(null, 'retail')).toBe(0.5);
  });
});

// ── scoreSoftware ────────────────────────────────────────────────
describe('scoreSoftware', () => {
  it('returns 1.0 on case-insensitive exact match', () => {
    expect(scoreSoftware('AccuLynx', 'acculynx')).toBe(1.0);
  });

  it('returns 0.0 on mismatch', () => {
    expect(scoreSoftware('JobNimbus', 'acculynx')).toBe(0.0);
  });

  it('returns null when buyer has no preferred software', () => {
    expect(scoreSoftware('AccuLynx', null)).toBeNull();
  });

  it('returns 0.5 when seller software is null', () => {
    expect(scoreSoftware(null, 'acculynx')).toBe(0.5);
  });
});

// ── scoreManagement ──────────────────────────────────────────────
describe('scoreManagement', () => {
  it('returns 1.0 when buyer preference is any', () => {
    expect(scoreManagement('owner_operated', 'any')).toBe(1.0);
  });

  it('returns 1.0 on exact match', () => {
    expect(scoreManagement('owner_operated', 'owner_operated')).toBe(1.0);
  });

  it('returns 0.0 on mismatch', () => {
    expect(scoreManagement('has_management_team', 'owner_operated')).toBe(0.0);
  });

  it('returns null when buyer preference is null', () => {
    expect(scoreManagement('owner_operated', null)).toBeNull();
  });

  it('returns 0.5 when seller type is null', () => {
    expect(scoreManagement(null, 'owner_operated')).toBe(0.5);
  });
});

// ── scorePair ────────────────────────────────────────────────────
describe('scorePair', () => {
  it('returns score between 0 and 100 for a matching pair', () => {
    const result = scorePair(baseBuyer, baseSeller, DEFAULT_WEIGHTS, new Set());
    expect(result.score).not.toBeNull();
    expect(result.score!).toBeGreaterThan(0);
    expect(result.score!).toBeLessThanOrEqual(100);
  });

  it('returns score 100 when seller perfectly matches all buyer criteria', () => {
    const result = scorePair(baseBuyer, baseSeller, DEFAULT_WEIGHTS, new Set());
    // baseSeller matches baseBuyer on all dimensions
    expect(result.score).toBe(100);
  });

  it('collapses score to 0 when a dealbreaker dimension scores 0', () => {
    // Set state to 'CA' which is not in target_states ['TX', 'FL']
    const nonMatchSeller = { ...baseSeller, state: 'CA' };
    const result = scorePair(baseBuyer, nonMatchSeller, DEFAULT_WEIGHTS, new Set<'geography'>(['geography']));
    expect(result.score).toBe(0);
  });

  it('does NOT collapse score when a dealbreaker dimension is skipped (buyer has no criterion)', () => {
    // buyer has no target_states → geography dimension is skipped
    const noCriteriaBuyer = { ...baseBuyer, target_states: null };
    const result = scorePair(noCriteriaBuyer, baseSeller, DEFAULT_WEIGHTS, new Set<'geography'>(['geography']));
    expect(result.score).not.toBe(0);
  });

  it('excludes zero-weight dimensions from the score calculation', () => {
    const zeroGeographyWeights: MatchWeights = { ...DEFAULT_WEIGHTS, geography: 0 };
    const nonMatchSeller = { ...baseSeller, state: 'CA' };
    // CA is not in target_states, but geography weight is 0 → should not affect score
    const withWeight = scorePair(baseBuyer, nonMatchSeller, DEFAULT_WEIGHTS, new Set());
    const withoutWeight = scorePair(baseBuyer, nonMatchSeller, zeroGeographyWeights, new Set());
    expect(withoutWeight.score).toBeGreaterThan(withWeight.score!);
  });

  it('returns null score when all buyer criteria are null', () => {
    const noCriteriaBuyer: Buyer = {
      ...baseBuyer,
      revenue_min: null, revenue_max: null,
      ebitda_min: null, ebitda_max: null,
      target_states: null,
      business_type: null,
      work_type: null,
      employee_min: null, employee_max: null,
      preferred_software: null,
      management_preference: null,
    };
    const result = scorePair(noCriteriaBuyer, baseSeller, DEFAULT_WEIGHTS, new Set());
    expect(result.score).toBeNull();
  });

  it('returns breakdown with null for skipped dimensions', () => {
    const noCriteriaBuyer = { ...baseBuyer, target_states: null };
    const result = scorePair(noCriteriaBuyer, baseSeller, DEFAULT_WEIGHTS, new Set());
    expect(result.breakdown.geography).toBeNull();
  });
});

// ── scoreAllSellers ──────────────────────────────────────────────
describe('scoreAllSellers', () => {
  it('returns results sorted by score descending', () => {
    const highSeller = { ...baseSeller, id: 's1' };
    const lowSeller = { ...baseSeller, id: 's2', state: 'CA', annual_revenue: 10_000_000 };
    const results = scoreAllSellers(baseBuyer, [lowSeller, highSeller], DEFAULT_WEIGHTS, new Set());
    expect(results[0].seller.id).toBe('s1');
  });

  it('places null-score results at the end', () => {
    const noCriteriaBuyer: Buyer = {
      ...baseBuyer,
      revenue_min: null, revenue_max: null, ebitda_min: null, ebitda_max: null,
      target_states: null, business_type: null, work_type: null,
      employee_min: null, employee_max: null, preferred_software: null,
      management_preference: null,
    };
    const results = scoreAllSellers(noCriteriaBuyer, [baseSeller], DEFAULT_WEIGHTS, new Set());
    expect(results[0].score).toBeNull();
  });
});

// ── scoreAllBuyers ───────────────────────────────────────────────
describe('scoreAllBuyers', () => {
  it('returns results sorted by score descending', () => {
    const goodBuyer = { ...baseBuyer, id: 'b1' };
    const badBuyer = { ...baseBuyer, id: 'b2', target_states: ['CA'], revenue_min: 5_000_000, revenue_max: 10_000_000 };
    const results = scoreAllBuyers(baseSeller, [badBuyer, goodBuyer], DEFAULT_WEIGHTS, new Set());
    expect(results[0].buyer.id).toBe('b1');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test
```

Expected: import error (matching.ts does not exist yet).

- [ ] **Step 3: Implement `matching.ts`**

Create `src/app/lib/utils/matching.ts`:
```ts
import type {
  Buyer, Seller, MatchDimension, MatchWeights,
  SellerMatchResult, BuyerMatchResult,
  BusinessType, BuyerBusinessType, WorkType, BuyerWorkType,
  ManagementType, ManagementPreference,
} from '../types';

export const DEFAULT_WEIGHTS: MatchWeights = {
  revenue: 5, ebitda: 5, geography: 5, businessType: 5,
  workType: 5, employeeCount: 5, software: 5, managementPreference: 5,
};

export const DIMENSION_LABELS: Record<MatchDimension, string> = {
  revenue: 'Revenue Range',
  ebitda: 'EBITDA Range',
  geography: 'Geography',
  businessType: 'Business Type',
  workType: 'Work Type',
  employeeCount: 'Employee Count',
  software: 'Software',
  managementPreference: 'Management Preference',
};

export function scoreRange(
  value: number | null,
  min: number | null,
  max: number | null,
): number | null {
  if (min === null && max === null) return null;
  if (value === null) return 0.5;

  const lo = min ?? 0;
  const hi = max ?? Infinity;

  if (value >= lo && value <= hi) return 1.0;

  if (value < lo) {
    return (lo - value) <= lo * 0.2 ? 0.5 : 0.0;
  }

  if (isFinite(hi) && value > hi) {
    return (value - hi) <= hi * 0.2 ? 0.5 : 0.0;
  }

  return 1.0;
}

export function scoreGeography(
  sellerState: string | null,
  targetStates: string[] | null,
): number | null {
  if (!targetStates || targetStates.length === 0) return null;
  if (sellerState === null) return 0.5;
  return targetStates.includes(sellerState) ? 1.0 : 0.0;
}

export function scoreBusinessType(
  sellerType: BusinessType | null,
  buyerType: BuyerBusinessType | null,
): number | null {
  if (buyerType === null) return null;
  if (sellerType === null) return 0.5;
  if (buyerType === 'any' || buyerType === 'both') return 1.0;
  if (sellerType === 'both') return 1.0;
  return sellerType === buyerType ? 1.0 : 0.0;
}

export function scoreWorkType(
  sellerType: WorkType | null,
  buyerType: BuyerWorkType | null,
): number | null {
  if (buyerType === null) return null;
  if (sellerType === null) return 0.5;
  if (buyerType === 'any' || buyerType === 'both') return 1.0;
  if (sellerType === 'both') return 1.0;
  return sellerType === buyerType ? 1.0 : 0.0;
}

export function scoreSoftware(
  sellerSoftware: string | null,
  buyerSoftware: string | null,
): number | null {
  if (buyerSoftware === null) return null;
  if (sellerSoftware === null) return 0.5;
  return sellerSoftware.toLowerCase() === buyerSoftware.toLowerCase() ? 1.0 : 0.0;
}

export function scoreManagement(
  sellerType: ManagementType | null,
  buyerPref: ManagementPreference | null,
): number | null {
  if (buyerPref === null) return null;
  if (sellerType === null) return 0.5;
  if (buyerPref === 'any') return 1.0;
  return sellerType === buyerPref ? 1.0 : 0.0;
}

function computeBreakdown(
  buyer: Buyer,
  seller: Seller,
): Record<MatchDimension, number | null> {
  return {
    revenue: scoreRange(seller.annual_revenue, buyer.revenue_min, buyer.revenue_max),
    ebitda: scoreRange(seller.ebitda, buyer.ebitda_min, buyer.ebitda_max),
    geography: scoreGeography(seller.state, buyer.target_states),
    businessType: scoreBusinessType(seller.business_type, buyer.business_type),
    workType: scoreWorkType(seller.work_type, buyer.work_type),
    employeeCount: scoreRange(seller.employee_count, buyer.employee_min, buyer.employee_max),
    software: scoreSoftware(seller.software, buyer.preferred_software),
    managementPreference: scoreManagement(seller.management_type, buyer.management_preference),
  };
}

export function scorePair(
  buyer: Buyer,
  seller: Seller,
  weights: MatchWeights,
  dealbreakers: Set<MatchDimension>,
): { score: number | null; breakdown: Record<MatchDimension, number | null> } {
  const breakdown = computeBreakdown(buyer, seller);
  const dims = Object.keys(breakdown) as MatchDimension[];

  for (const dim of dealbreakers) {
    const raw = breakdown[dim];
    if (raw !== null && raw === 0 && weights[dim] > 0) {
      return { score: 0, breakdown };
    }
  }

  let numerator = 0;
  let denominator = 0;

  for (const dim of dims) {
    const raw = breakdown[dim];
    const weight = weights[dim];
    if (raw === null || weight === 0) continue;
    numerator += raw * weight;
    denominator += weight;
  }

  if (denominator === 0) return { score: null, breakdown };

  return { score: Math.round((numerator / denominator) * 100), breakdown };
}

function sortByScore<T extends { score: number | null }>(results: T[]): T[] {
  return results.sort((a, b) => {
    if (a.score === null && b.score === null) return 0;
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });
}

export function scoreAllSellers(
  buyer: Buyer,
  sellers: Seller[],
  weights: MatchWeights,
  dealbreakers: Set<MatchDimension>,
): SellerMatchResult[] {
  return sortByScore(
    sellers.map((seller) => ({ seller, ...scorePair(buyer, seller, weights, dealbreakers) }))
  );
}

export function scoreAllBuyers(
  seller: Seller,
  buyers: Buyer[],
  weights: MatchWeights,
  dealbreakers: Set<MatchDimension>,
): BuyerMatchResult[] {
  return sortByScore(
    buyers.map((buyer) => ({ buyer, ...scorePair(buyer, seller, weights, dealbreakers) }))
  );
}
```

- [ ] **Step 4: Run tests — verify they all pass**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/lib/utils/matching.ts src/app/lib/utils/matching.test.ts
git commit -m "feat: implement matching engine scoring functions"
```

---

### Task 4: Build MatchSidebar component

**Files:**
- Create: `src/shared/components/matchView/matchSidebar.tsx`
- Create: `src/shared/components/matchView/matchView.scss` (shared styles for all matchView components)

**Interfaces:**
- Consumes: `MatchWeights`, `MatchDimension` from `../../../app/lib/types`; `DIMENSION_LABELS` from `../../../app/lib/utils/matching`
- Props:
  ```ts
  interface MatchSidebarProps {
    weights: MatchWeights;
    onWeightChange: (dim: MatchDimension, value: number) => void;
    dealbreakers: Set<MatchDimension>;
    onDealbreakersChange: (dim: MatchDimension) => void;
    onPrint: () => void;
  }
  ```

- [ ] **Step 1: Create `matchView.scss`**

Create `src/shared/components/matchView/matchView.scss`:
```scss
.match-view {
  display: flex;
  gap: 1.5rem;
  height: calc(100vh - 80px);
  overflow: hidden;
}

.match-sidebar {
  width: 260px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 1rem;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.match-sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.match-sidebar-title {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.45;
}

.match-dimension-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.match-dimension-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
}

.match-dimension-name {
  opacity: 0.8;
}

.match-dimension-value {
  font-weight: 700;
  font-size: 0.7rem;
  opacity: 0.6;
}

.match-weight-slider {
  width: 100%;
  accent-color: #6366f1;
  cursor: pointer;
}

.match-dealbreaker-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;

  input[type='checkbox'] {
    accent-color: #ef4444;
    cursor: pointer;
  }

  &--active {
    color: #f87171;
  }
}

.match-print-btn {
  margin-top: auto;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
  }
}

// ── Main panel ──────────────────────────────────────────────────
.match-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.match-panel-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

.match-pivot-btn {
  padding: 0.35rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.75rem;
  font-weight: 600;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &--active {
    background: rgba(255, 255, 255, 0.12);
    border-color: rgba(255, 255, 255, 0.4);
  }
}

.match-columns {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.match-picker {
  width: 220px;
  flex-shrink: 0;
  overflow-y: auto;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.match-picker-item {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.1s;
  border: 1px solid transparent;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  &--selected {
    background: rgba(99, 102, 241, 0.18);
    border-color: rgba(99, 102, 241, 0.4);
    font-weight: 600;
  }
}

.match-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.match-empty {
  padding: 2rem 1rem;
  opacity: 0.5;
  font-size: 0.85rem;
}

// ── Match card ──────────────────────────────────────────────────
.match-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  transition: border-color 0.15s;

  &:hover {
    border-color: rgba(255, 255, 255, 0.22);
  }
}

.match-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.match-card-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.match-card-score {
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1;

  &--high { color: #4ade80; }
  &--mid  { color: #facc15; }
  &--low  { color: #f87171; }
  &--null { color: rgba(255, 255, 255, 0.3); font-size: 0.8rem; }
}

.match-card-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.72rem;
  opacity: 0.65;
}

.match-card-breakdown {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.35rem;
}

.match-breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.match-breakdown-label {
  font-size: 0.6rem;
  opacity: 0.45;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.match-breakdown-value {
  font-size: 0.72rem;
  font-weight: 600;

  &--high   { color: #4ade80; }
  &--mid    { color: #facc15; }
  &--low    { color: #f87171; }
  &--skip   { opacity: 0.3; }
}

// ── Print styles ────────────────────────────────────────────────
@media print {
  .match-sidebar { display: none !important; }
  .match-view { height: auto; overflow: visible; }
  .match-panel { overflow: visible; }
  .match-columns { overflow: visible; }
  .match-picker { display: none; }
  .match-list { overflow: visible; }
  .match-print-header { display: block !important; margin-bottom: 1rem; }
}

.match-print-header {
  display: none;
}
```

- [ ] **Step 2: Create `matchSidebar.tsx`**

Create `src/shared/components/matchView/matchSidebar.tsx`:
```tsx
"use client";

import type { MatchDimension, MatchWeights } from '../../../app/lib/types';
import { DIMENSION_LABELS } from '../../../app/lib/utils/matching';

const DIMENSIONS = Object.keys(DIMENSION_LABELS) as MatchDimension[];

interface MatchSidebarProps {
  weights: MatchWeights;
  onWeightChange: (dim: MatchDimension, value: number) => void;
  dealbreakers: Set<MatchDimension>;
  onDealbreakersChange: (dim: MatchDimension) => void;
  onPrint: () => void;
}

export default function MatchSidebar({
  weights,
  onWeightChange,
  dealbreakers,
  onDealbreakersChange,
  onPrint,
}: MatchSidebarProps) {
  return (
    <aside className="match-sidebar">

      <div className="match-sidebar-section">
        <span className="match-sidebar-title">Weights</span>
        {DIMENSIONS.map((dim) => (
          <div key={dim} className="match-dimension-row">
            <div className="match-dimension-label">
              <span className="match-dimension-name">{DIMENSION_LABELS[dim]}</span>
              <span className="match-dimension-value">{weights[dim]}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={weights[dim]}
              onChange={(e) => onWeightChange(dim, Number(e.target.value))}
              className="match-weight-slider"
              aria-label={`Weight for ${DIMENSION_LABELS[dim]}`}
            />
          </div>
        ))}
      </div>

      <div className="match-sidebar-section">
        <span className="match-sidebar-title">Dealbreakers</span>
        {DIMENSIONS.map((dim) => {
          const active = dealbreakers.has(dim);
          return (
            <label
              key={dim}
              className={`match-dealbreaker-row${active ? ' match-dealbreaker-row--active' : ''}`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => onDealbreakersChange(dim)}
              />
              {DIMENSION_LABELS[dim]}
            </label>
          );
        })}
      </div>

      <button className="match-print-btn" onClick={onPrint} type="button">
        Print snapshot
      </button>

    </aside>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/shared/components/matchView/matchSidebar.tsx src/shared/components/matchView/matchView.scss
git commit -m "feat: add MatchSidebar component with weight sliders and dealbreakers"
```

---

### Task 5: Build MatchCard component

**Files:**
- Create: `src/shared/components/matchView/matchCard.tsx`

**Interfaces:**
- Consumes: `SellerMatchResult`, `BuyerMatchResult`, `MatchDimension` from `../../../app/lib/types`; `DIMENSION_LABELS` from `../../../app/lib/utils/matching`
- Props:
  ```ts
  interface MatchCardProps {
    result: SellerMatchResult | BuyerMatchResult;
  }
  ```

- [ ] **Step 1: Create `matchCard.tsx`**

Create `src/shared/components/matchView/matchCard.tsx`:
```tsx
"use client";

import type { SellerMatchResult, BuyerMatchResult, MatchDimension } from '../../../app/lib/types';
import { DIMENSION_LABELS } from '../../../app/lib/utils/matching';

type Props = { result: SellerMatchResult | BuyerMatchResult };

function formatMoney(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

function scoreColorClass(score: number | null, prefix: string): string {
  if (score === null) return `${prefix}--null`;
  if (score >= 70) return `${prefix}--high`;
  if (score >= 40) return `${prefix}--mid`;
  return `${prefix}--low`;
}

function breakdownColorClass(raw: number | null): string {
  if (raw === null) return 'match-breakdown-value--skip';
  if (raw >= 0.7) return 'match-breakdown-value--high';
  if (raw >= 0.4) return 'match-breakdown-value--mid';
  return 'match-breakdown-value--low';
}

function formatRaw(raw: number | null): string {
  if (raw === null) return '—';
  return `${Math.round(raw * 100)}%`;
}

export default function MatchCard({ result }: Props) {
  const isSeller = 'seller' in result;
  const { score, breakdown } = result;

  const name = isSeller
    ? (result as SellerMatchResult).seller.company_name
    : (result as BuyerMatchResult).buyer.organization_name;

  const meta = isSeller
    ? (() => {
        const s = (result as SellerMatchResult).seller;
        return [
          { label: 'Revenue', value: formatMoney(s.annual_revenue) },
          { label: 'EBITDA', value: formatMoney(s.ebitda) },
          { label: 'State', value: s.state ?? '—' },
          { label: 'Employees', value: s.employee_count != null ? String(s.employee_count) : '—' },
        ];
      })()
    : (() => {
        const b = (result as BuyerMatchResult).buyer;
        return [
          { label: 'Revenue', value: `${formatMoney(b.revenue_min)}–${formatMoney(b.revenue_max)}` },
          { label: 'EBITDA', value: `${formatMoney(b.ebitda_min)}–${formatMoney(b.ebitda_max)}` },
          { label: 'States', value: b.target_states?.join(', ') ?? 'Any' },
          { label: 'Employees', value: b.employee_min != null ? `${b.employee_min}–${b.employee_max ?? '∞'}` : 'Any' },
        ];
      })();

  const dims = Object.keys(breakdown) as MatchDimension[];

  return (
    <div className="match-card">
      <div className="match-card-header">
        <span className="match-card-name">{name}</span>
        <span className={`match-card-score ${scoreColorClass(score, 'match-card-score')}`}>
          {score !== null ? score : 'Insufficient data'}
        </span>
      </div>

      <div className="match-card-meta">
        {meta.map(({ label, value }) => (
          <span key={label}><strong>{label}:</strong> {value}</span>
        ))}
      </div>

      <div className="match-card-breakdown">
        {dims.map((dim) => (
          <div key={dim} className="match-breakdown-item">
            <span className="match-breakdown-label">{DIMENSION_LABELS[dim].split(' ')[0]}</span>
            <span className={`match-breakdown-value ${breakdownColorClass(breakdown[dim])}`}>
              {formatRaw(breakdown[dim])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/shared/components/matchView/matchCard.tsx
git commit -m "feat: add MatchCard component with score and dimension breakdown"
```

---

### Task 6: Build MatchPanel component

**Files:**
- Create: `src/shared/components/matchView/matchPanel.tsx`

**Interfaces:**
- Consumes: `Buyer`, `Seller`, `SellerMatchResult`, `BuyerMatchResult` from `../../../app/lib/types`; `MatchCard` from `./matchCard`
- Props:
  ```ts
  type PivotMode = 'buyer-first' | 'seller-first';

  interface MatchPanelProps {
    pivot: PivotMode;
    onPivotChange: (mode: PivotMode) => void;
    buyers: Buyer[];
    sellers: Seller[];
    anchorId: string | null;
    onAnchorChange: (id: string) => void;
    results: SellerMatchResult[] | BuyerMatchResult[];
  }
  ```

- [ ] **Step 1: Create `matchPanel.tsx`**

Create `src/shared/components/matchView/matchPanel.tsx`:
```tsx
"use client";

import type { Buyer, Seller, SellerMatchResult, BuyerMatchResult } from '../../../app/lib/types';
import MatchCard from './matchCard';

type PivotMode = 'buyer-first' | 'seller-first';

interface MatchPanelProps {
  pivot: PivotMode;
  onPivotChange: (mode: PivotMode) => void;
  buyers: Buyer[];
  sellers: Seller[];
  anchorId: string | null;
  onAnchorChange: (id: string) => void;
  results: SellerMatchResult[] | BuyerMatchResult[];
}

export default function MatchPanel({
  pivot,
  onPivotChange,
  buyers,
  sellers,
  anchorId,
  onAnchorChange,
  results,
}: MatchPanelProps) {
  const isBuyerFirst = pivot === 'buyer-first';
  const pickerItems: { id: string; label: string }[] = isBuyerFirst
    ? buyers.map((b) => ({ id: b.id, label: b.organization_name }))
    : sellers.map((s) => ({ id: s.id, label: s.company_name }));

  return (
    <div className="match-panel">
      <div className="match-panel-header">
        <button
          type="button"
          className={`match-pivot-btn${isBuyerFirst ? ' match-pivot-btn--active' : ''}`}
          onClick={() => onPivotChange('buyer-first')}
        >
          Buyer-first
        </button>
        <button
          type="button"
          className={`match-pivot-btn${!isBuyerFirst ? ' match-pivot-btn--active' : ''}`}
          onClick={() => onPivotChange('seller-first')}
        >
          Seller-first
        </button>
      </div>

      <div className="match-columns">
        <div className="match-picker">
          {pickerItems.length === 0 && (
            <span className="match-empty">No {isBuyerFirst ? 'buyers' : 'sellers'} found.</span>
          )}
          {pickerItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`match-picker-item${anchorId === item.id ? ' match-picker-item--selected' : ''}`}
              onClick={() => onAnchorChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="match-list">
          {anchorId === null && (
            <span className="match-empty">
              Select a {isBuyerFirst ? 'buyer' : 'seller'} to see matches.
            </span>
          )}
          {anchorId !== null && results.length === 0 && (
            <span className="match-empty">No counterparts to score.</span>
          )}
          {results.map((result) => {
            const key = 'seller' in result ? result.seller.id : result.buyer.id;
            return <MatchCard key={key} result={result} />;
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/shared/components/matchView/matchPanel.tsx
git commit -m "feat: add MatchPanel with pivot toggle, entity picker, and ranked list"
```

---

### Task 7: Build MatchView layout (state owner)

**Files:**
- Create: `src/shared/components/matchView/matchView.tsx`

**Interfaces:**
- Consumes: `Buyer`, `Seller`, `MatchWeights`, `MatchDimension` from `../../../app/lib/types`; `DEFAULT_WEIGHTS`, `scoreAllSellers`, `scoreAllBuyers` from `../../../app/lib/utils/matching`; `MatchSidebar`, `MatchPanel`
- Props:
  ```ts
  interface MatchViewProps {
    buyers: Buyer[];
    sellers: Seller[];
  }
  ```

- [ ] **Step 1: Create `matchView.tsx`**

Create `src/shared/components/matchView/matchView.tsx`:
```tsx
"use client";

import { useState, useMemo } from 'react';
import type { Buyer, Seller, MatchWeights, MatchDimension } from '../../../app/lib/types';
import { DEFAULT_WEIGHTS, scoreAllSellers, scoreAllBuyers } from '../../../app/lib/utils/matching';
import MatchSidebar from './matchSidebar';
import MatchPanel from './matchPanel';
import './matchView.scss';

type PivotMode = 'buyer-first' | 'seller-first';

interface MatchViewProps {
  buyers: Buyer[];
  sellers: Seller[];
}

export default function MatchView({ buyers, sellers }: MatchViewProps) {
  const [pivot, setPivot] = useState<PivotMode>('buyer-first');
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [weights, setWeights] = useState<MatchWeights>(DEFAULT_WEIGHTS);
  const [dealbreakers, setDealbreakers] = useState<Set<MatchDimension>>(new Set());

  const handleWeightChange = (dim: MatchDimension, value: number) => {
    setWeights((prev) => ({ ...prev, [dim]: value }));
  };

  const handleDealbreakersChange = (dim: MatchDimension) => {
    setDealbreakers((prev) => {
      const next = new Set(prev);
      if (next.has(dim)) next.delete(dim); else next.add(dim);
      return next;
    });
  };

  const handlePivotChange = (mode: PivotMode) => {
    setPivot(mode);
    setAnchorId(null);
  };

  const results = useMemo(() => {
    if (anchorId === null) return [];

    if (pivot === 'buyer-first') {
      const buyer = buyers.find((b) => b.id === anchorId);
      if (!buyer) return [];
      return scoreAllSellers(buyer, sellers, weights, dealbreakers);
    } else {
      const seller = sellers.find((s) => s.id === anchorId);
      if (!seller) return [];
      return scoreAllBuyers(seller, buyers, weights, dealbreakers);
    }
  }, [pivot, anchorId, buyers, sellers, weights, dealbreakers]);

  return (
    <div className="match-view">
      <div className="match-print-header">
        <h2 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Match Report</h2>
        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
          {new Date().toLocaleString()} — {pivot === 'buyer-first' ? 'Buyer-first' : 'Seller-first'}
        </p>
      </div>
      <MatchSidebar
        weights={weights}
        onWeightChange={handleWeightChange}
        dealbreakers={dealbreakers}
        onDealbreakersChange={handleDealbreakersChange}
        onPrint={() => window.print()}
      />
      <MatchPanel
        pivot={pivot}
        onPivotChange={handlePivotChange}
        buyers={buyers}
        sellers={sellers}
        anchorId={anchorId}
        onAnchorChange={setAnchorId}
        results={results}
      />
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/shared/components/matchView/matchView.tsx
git commit -m "feat: add MatchView layout — state owner for weights, dealbreakers, pivot, and scoring"
```

---

### Task 8: Create /brokerage/match page and add broker menu link

**Files:**
- Create: `src/app/brokerage/match/page.tsx`
- Modify: `src/shared/components/menu/menu.tsx`

**Interfaces:**
- Consumes: `getAllBuyers` from `../../lib/supabase/buyers`; `getAllSellers` from `../../lib/supabase/sellers`; `MatchView` from `../../../shared/components/matchView/matchView`; `ProtectedRoute` from `../../utils/protectedRoute`; `useAuth` from `../../utils/isAuth`; `Loader` from `../../../shared/components/loader/loader`

- [ ] **Step 1: Create `src/app/brokerage/match/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '../../utils/isAuth';
import { getAllBuyers } from '../../lib/supabase/buyers';
import { getAllSellers } from '../../lib/supabase/sellers';
import type { Buyer, Seller } from '../../lib/types';
import MatchView from '../../../shared/components/matchView/matchView';
import Loader from '../../../shared/components/loader/loader';
import ProtectedRoute from '../../utils/protectedRoute';

const MatchPage = () => {
  const { effectiveRole } = useAuth();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (effectiveRole !== 'broker' && effectiveRole !== null) {
    redirect('/inicio');
  }

  useEffect(() => {
    Promise.all([getAllBuyers(), getAllSellers()])
      .then(([b, s]) => { setBuyers(b); setSellers(s); })
      .catch(() => setError('Failed to load data. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="p-4 sm:p-6 animate-fadeInUp" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-3xl font-bold">Match</h1>
        {!loading && (
          <span className="text-sm opacity-60">
            {buyers.length} buyers · {sellers.length} sellers
          </span>
        )}
      </div>

      {loading && <Loader block />}
      {error && (
        <div className="flex items-center gap-3">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            type="button"
            className="text-xs underline opacity-70"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}
      {!loading && !error && <MatchView buyers={buyers} sellers={sellers} />}
    </section>
  );
};

export default ProtectedRoute(MatchPage);
```

- [ ] **Step 2: Add "Match" link for broker in `menu.tsx`**

In `src/shared/components/menu/menu.tsx`, find the block for the broker Dashboard link and add the Match link immediately after it:

```tsx
{effectiveRole === 'broker' && (
  <li>
    <Link
      className={`link ${pathname === "/brokerage/match" ? "active" : ""}`}
      href='/brokerage/match'
      onClick={() => setIsOpen(false)}
    >
      Match
    </Link>
  </li>
)}
```

Place this block right after the closing `)}` of the existing broker/buyer Dashboard `<li>` block.

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run the app and verify**

```bash
npm run dev
```

Open `http://localhost:3000`. Log in as broker. Verify:
- "Match" link appears in the menu.
- Navigating to `/brokerage/match` loads buyers and sellers.
- Selecting a buyer shows sellers ranked by score.
- Selecting a seller shows buyers ranked by score.
- Moving a weight slider updates scores in real time.
- Checking a dealbreaker collapses affected pairs to 0.
- "Print snapshot" triggers the print dialog with sidebar hidden.
- Non-broker users navigating to `/brokerage/match` are redirected to `/inicio`.

- [ ] **Step 5: Run tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/brokerage/match/page.tsx src/shared/components/menu/menu.tsx
git commit -m "feat: add /brokerage/match page and broker menu link"
```
