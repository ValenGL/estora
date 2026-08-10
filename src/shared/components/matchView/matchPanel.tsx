"use client";

import type { Buyer, Seller, SellerMatchResult, BuyerMatchResult } from '../../../app/lib/types';
import MatchCard from './matchCard';

type PivotMode = 'buyer-first' | 'seller-first';

interface MatchPanelProps {
  pivot: PivotMode;
  buyers: Buyer[];
  sellers: Seller[];
  anchorId: string | null;
  onAnchorChange: (id: string) => void;
  results: SellerMatchResult[] | BuyerMatchResult[];
  pickerScores: Map<string, number | null>;
}

export default function MatchPanel({
  pivot,
  buyers,
  sellers,
  anchorId,
  onAnchorChange,
  results,
  pickerScores,
}: MatchPanelProps) {
  const isBuyerFirst = pivot === 'buyer-first';

  const pickerItems = (isBuyerFirst
    ? buyers.map((b) => ({ id: b.id, label: b.organization_name, score: pickerScores.get(b.id) ?? null }))
    : sellers.map((s) => ({ id: s.id, label: s.company_name, score: pickerScores.get(s.id) ?? null }))
  ).sort((a, b) => {
    if (a.score === null && b.score === null) return 0;
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return b.score - a.score;
  });

  return (
    <div className="match-panel">
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
              <span className="match-picker-label">{item.label}</span>
              <span className={`match-picker-score${item.score !== null && item.score >= 70 ? ' match-picker-score--high' : item.score !== null && item.score >= 40 ? ' match-picker-score--mid' : item.score !== null ? ' match-picker-score--low' : ''}`}>
                {item.score !== null ? `${item.score}%` : '—'}
              </span>
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
