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
            <p className="text-base font-bold">{seller.state ?? 'Florida'}</p>
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
          <span>{seller.years_in_business != null ? `${seller.years_in_business} yrs` : 'Florida'}</span>
        </BlurredField>
        <BlurredField active={blurred}>
          <span>{seller.employee_count != null ? `${seller.employee_count} employees` : 'Florida'}</span>
        </BlurredField>
      </div>

    </div>
  );
}
