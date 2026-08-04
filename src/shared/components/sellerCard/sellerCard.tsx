"use client";

import { useState } from "react";
import type { Seller } from '../../../app/lib/types';
import "./sellerCard.scss";

interface SellerCardProps {
  seller: Seller;
  blurred?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
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

export default function SellerCard({ seller, blurred = false, onEdit, onDelete }: SellerCardProps) {
  const [confirming, setConfirming] = useState(false);

  const hasActions = onEdit !== undefined || onDelete !== undefined;

  return (
    <div className="seller-card u-bgcolor-estora-black u-color-estora-white rounded-2xl p-4 flex flex-col gap-3 shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)]">

      <div>
        <span className={`status-badge status-badge--${seller.status}`}>
          {STATUS_LABEL[seller.status]}
        </span>
      </div>

      <div>
        <BlurredField active={blurred}>
          <h3 className="text-lg font-semibold leading-tight">
            {seller.company_name}
          </h3>
        </BlurredField>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="opacity-60 text-xs uppercase tracking-wider">Revenue</span>
          <p className="text-base font-bold">{formatMoney(seller.annual_revenue)}</p>
        </div>
        <div className="text-right">
          <span className="opacity-60 text-xs uppercase tracking-wider">State</span>
          <p className="text-base font-bold">{seller.state ?? '—'}</p>
        </div>
      </div>

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

      <BlurredField active={blurred}>
        <div className="flex flex-wrap gap-1">
          {seller.business_type && <span className="chip">{seller.business_type}</span>}
          {seller.work_type && <span className="chip">{seller.work_type}</span>}
        </div>
      </BlurredField>

      <div className="flex items-center justify-between text-xs opacity-70 pt-1 border-t border-white/10">
        <BlurredField active={blurred}>
          <span>{seller.years_in_business != null ? `${seller.years_in_business} yrs` : '—'}</span>
        </BlurredField>
        <BlurredField active={blurred}>
          <span>{seller.employee_count != null ? `${seller.employee_count} employees` : '—'}</span>
        </BlurredField>
      </div>

      {hasActions && (
        <div className="seller-card-actions">
          {confirming ? (
            <>
              <span className="seller-card-confirm-text">Delete this listing?</span>
              <button className="seller-card-action-btn seller-card-action-btn--confirm" onClick={() => { setConfirming(false); onDelete?.(); }} type="button">Confirm</button>
              <button className="seller-card-action-btn" onClick={() => setConfirming(false)} type="button">Cancel</button>
            </>
          ) : (
            <>
              {onEdit && <button className="seller-card-action-btn" onClick={onEdit} type="button">Edit</button>}
              {onDelete && <button className="seller-card-action-btn seller-card-action-btn--danger" onClick={() => setConfirming(true)} type="button">Delete</button>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
