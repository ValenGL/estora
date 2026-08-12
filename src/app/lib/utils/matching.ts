import type {
  Buyer, Seller, MatchDimension, MatchWeights,
  MatchPairResult,
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

export function sortByScore<T extends { score: number | null }>(results: T[]): T[] {
  return [...results].sort((a, b) => {
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
): MatchPairResult[] {
  return sortByScore(
    sellers.map((seller) => ({ pivot: 'buyer-first' as const, buyer, seller, ...scorePair(buyer, seller, weights, dealbreakers) }))
  );
}

export function scoreAllBuyers(
  seller: Seller,
  buyers: Buyer[],
  weights: MatchWeights,
  dealbreakers: Set<MatchDimension>,
): MatchPairResult[] {
  return sortByScore(
    buyers.map((buyer) => ({ pivot: 'seller-first' as const, seller, buyer, ...scorePair(buyer, seller, weights, dealbreakers) }))
  );
}
