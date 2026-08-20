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
  external_id: null, buyer_category: null, source: 'onboarding', imported_by: null,
  roofing_qualified: null, engagement_level: null, buyer_status: null,
  investment_thesis: null, hq_state: null, website: null,
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
