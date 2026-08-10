# Matching Engine Design — The Roofing Biz Broker Portal

**Date:** 2026-08-10
**Sprint:** MVP Sprint 2 — Matching Engine
**Status:** Approved

---

## Context

The matching engine computes a compatibility score (0–100) between a buyer's Buy Box and a seller's business profile. It is a broker-only tool surfaced in a new `/brokerage/match` view. Scores are ephemeral — they live in session state and are never persisted to the database. The broker can configure weights and dealbreakers interactively, and print a snapshot of the current ranking.

---

## Scope

In scope:
- New route `/brokerage/match` (broker-only)
- Client-side scoring engine (`matching.ts`)
- Pivotable view: buyer-first and seller-first
- Adjustable per-dimension weights via sliders (0–10)
- Configurable dealbreakers via checkboxes
- Print snapshot via `window.print()`

Out of scope:
- `matches` table in the database (deferred)
- Buyer-facing match view (deferred)
- Persisted weight/dealbreaker configuration (deferred)
- Access request or NDA flow (separate sprint)

---

## Architecture

All scoring happens client-side in TypeScript. On mount, the page fetches all buyers and all sellers in parallel using the existing `getAllBuyers()` and `getAllSellers()` functions. The data lives in React state. Score computation runs synchronously via `useMemo` — no API routes, no database writes, no additional network calls after the initial load.

When the broker moves a slider or checks a dealbreaker, React state updates and scores recompute instantly.

**No new database tables are introduced in this sprint.**

---

## Scoring Model

This section is the source of truth for scoring rules. It is intentionally written as a human-readable document so it can be shared with the client and iterated without touching code.

### Dimensions

There are 8 matchable dimensions. Each produces a raw score from 0.0 to 1.0.

**1. Revenue Range**
- Seller's `annual_revenue` is inside buyer's `[revenue_min, revenue_max]` → 1.0
- Within 20% outside either boundary → 0.5
- More than 20% outside → 0.0
- If buyer has no revenue range set (both null) → dimension skipped

**2. EBITDA Range**
- Same logic as Revenue Range, applied to `ebitda` vs `[ebitda_min, ebitda_max]`
- If buyer has no EBITDA range set (both null) → dimension skipped

**3. Geography**
- Seller's `state` is in buyer's `target_states[]` → 1.0
- Not present in the array → 0.0
- If buyer has no `target_states` (null or empty) → dimension skipped

**4. Business Type**
- Buyer is `'any'` → 1.0
- Buyer is `'both'` → 1.0 (accepts any seller type)
- Exact match (e.g. both `'residential'`) → 1.0
- No overlap → 0.0
- If buyer has no preference (null) → dimension skipped

**5. Work Type**
- Same logic as Business Type, applied to `work_type`
- If buyer has no preference (null) → dimension skipped

**6. Employee Count**
- Same range logic as Revenue Range, applied to `employee_count` vs `[employee_min, employee_max]`
- If buyer has no employee range set (both null) → dimension skipped

**7. Software**
- Case-insensitive exact string match → 1.0
- No match → 0.0
- If buyer has no `preferred_software` (null) → dimension skipped

**8. Management Preference**
- Buyer is `'any'` → 1.0
- Exact match → 1.0
- No match → 0.0
- If buyer has no preference (null) → dimension skipped

### Null Seller Fields

If the seller has not filled in a field, that dimension scores **0.5** (unknown, neutral). It is not treated as a mismatch.

### Final Score Formula

```
score = ( Σ raw_i × weight_i ) / ( Σ weight_i ) × 100
```

Only dimensions that are not skipped (buyer criterion is defined) and have `weight > 0` count toward the denominator.

If a seller field is null, that dimension contributes `0.5 × weight_i` to the numerator.

If the score is computed from 0 active dimensions (all buyer criteria are null), the result is `null` and the UI shows "Insufficient data".

### Dealbreaker Logic

Any dimension can be marked as a dealbreaker by the broker. If a dimension is a dealbreaker and its raw score for a given pair is 0.0, the total score for that pair collapses to **0** regardless of other dimensions.

Dealbreaker configuration is session-only and resets on page refresh.

If a dimension is marked as a dealbreaker but the buyer has no criterion set for it (dimension is skipped), the dealbreaker has no effect — there is nothing to compare against.

---

## Component Structure

```
src/app/brokerage/match/
  page.tsx                  — client component, fetches data, owns state

src/app/lib/utils/
  matching.ts               — pure scoring functions

src/shared/components/matchView/
  matchView.tsx             — layout container (sidebar + main panel)
  matchSidebar.tsx          — weight sliders + dealbreaker checkboxes + print button
  matchPanel.tsx            — pivot toggle + entity picker + ranked list
  matchPicker.tsx           — scrollable list of buyers or sellers (anchor selection)
  matchList.tsx             — ranked counterpart cards
  matchCard.tsx             — individual card: name, score, per-dimension breakdown
```

---

## Data Flow

1. Page mounts → `Promise.all([getAllBuyers(), getAllSellers()])` — parallel fetch.
2. Broker selects pivot direction (buyer-first or seller-first) and picks an anchor entity.
3. `scoreAll(anchor, counterparts, weights, dealbreakers)` runs via `useMemo`.
4. Results render as a ranked list sorted by score descending.
5. Broker adjusts sliders or dealbreaker checkboxes → state updates → `useMemo` recomputes.
6. Broker clicks Print → `window.print()` with print-specific CSS that hides the sidebar.

---

## Error Handling

- If the initial fetch fails, show a single error message with a retry button. No partial rendering.
- If a pair has 0 active dimensions (all buyer criteria are null), show "Insufficient data" instead of a score.
- If a seller has all null fields, every dimension scores 0.5 and the result is a valid score based on weight distribution.

---

## Types

Two new types added to `src/app/lib/types.ts`:

```ts
export interface MatchWeights {
  revenue: number;       // 0–10
  ebitda: number;
  geography: number;
  businessType: number;
  workType: number;
  employeeCount: number;
  software: number;
  managementPreference: number;
}

export interface MatchResult {
  entity: Seller | Buyer;
  score: number | null;
  breakdown: Record<keyof MatchWeights, number | null>;
}
```

---

## Testing

Unit tests cover `src/app/lib/utils/matching.ts`:

- `scoreDimension`: exact match, partial range (within 20%), out of range, null buyer criterion (skip), null seller field (0.5), `'any'` value → 1.0.
- `scorePair`: dealbreaker collapse to 0, weight normalization, all-null buyer result, zero-weight dimension excluded from denominator.

No UI tests for this sprint.

---

## Print Snapshot

A `@media print` CSS rule hides `.match-sidebar` and shows only `.match-results` with the anchor entity name, timestamp, weight configuration, and the full ranked list with per-dimension breakdowns. No third-party libraries required.

---

## Deferred

- `matches` table in Supabase (precomputed scores for querying)
- Buyer-facing match view
- Persisted broker weight/dealbreaker configuration
- Neighboring-state partial geography scoring (currently binary)
- Fuzzy software name matching
