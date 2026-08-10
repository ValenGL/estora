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
