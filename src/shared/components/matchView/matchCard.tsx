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
