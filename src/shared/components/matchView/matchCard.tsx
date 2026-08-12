"use client";

import type { MatchPairResult, MatchDimension } from '../../../app/lib/types';
import { DIMENSION_LABELS } from '../../../app/lib/utils/matching';

type Props = { result: MatchPairResult };

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
  const { pivot, buyer, seller, score, breakdown } = result;
  const isBuyerFirst = pivot === 'buyer-first';

  const primaryName = isBuyerFirst ? seller.company_name : buyer.organization_name;
  const anchorName = isBuyerFirst ? buyer.organization_name : seller.company_name;

  const meta = isBuyerFirst
    ? [
        { label: 'Revenue', value: formatMoney(seller.annual_revenue) },
        { label: 'EBITDA', value: formatMoney(seller.ebitda) },
        { label: 'State', value: seller.state ?? '—' },
        { label: 'Employees', value: seller.employee_count != null ? String(seller.employee_count) : '—' },
      ]
    : [
        { label: 'Revenue', value: `${formatMoney(buyer.revenue_min)}–${formatMoney(buyer.revenue_max)}` },
        { label: 'EBITDA', value: `${formatMoney(buyer.ebitda_min)}–${formatMoney(buyer.ebitda_max)}` },
        { label: 'States', value: buyer.target_states?.join(', ') ?? 'Any' },
        { label: 'Employees', value: buyer.employee_min != null ? `${buyer.employee_min}–${buyer.employee_max ?? '∞'}` : 'Any' },
      ];

  const dims = Object.keys(breakdown) as MatchDimension[];

  return (
    <div className="match-card">
      <div className="match-card-header">
        <div className="match-card-names">
          <span className="match-card-name">{primaryName}</span>
          <span className="match-card-anchor">vs. {anchorName}</span>
        </div>
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
