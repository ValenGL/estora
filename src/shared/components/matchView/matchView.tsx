"use client";

import { useState, useMemo } from 'react';
import type { Buyer, Seller, MatchWeights, MatchDimension } from '../../../app/lib/types';
import { DEFAULT_WEIGHTS, DIMENSION_LABELS, scoreAllSellers, scoreAllBuyers } from '../../../app/lib/utils/matching';
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

  const anchorName = useMemo(() => {
    if (anchorId === null) return 'No anchor selected.';
    if (pivot === 'buyer-first') {
      const buyer = buyers.find((b) => b.id === anchorId);
      return buyer ? buyer.organization_name : 'No anchor selected.';
    }
    const seller = sellers.find((s) => s.id === anchorId);
    return seller ? seller.company_name : 'No anchor selected.';
  }, [pivot, anchorId, buyers, sellers]);

  return (
    <div className="match-view">
      <div className="match-print-header">
        <h2>Match Report</h2>
        <p className="match-print-anchor">
          {pivot === 'buyer-first' ? 'Buyer-first' : 'Seller-first'} — {anchorName}
        </p>
        <p className="match-print-anchor">
          {new Date().toLocaleString()}
        </p>
        <p className="match-print-anchor">Weight configuration:</p>
        <ul className="match-print-weight-list">
          {(Object.keys(DIMENSION_LABELS) as MatchDimension[]).map((dim) => (
            <li key={dim}>
              {DIMENSION_LABELS[dim]}: {weights[dim]}
              {dealbreakers.has(dim) ? ' (dealbreaker)' : ''}
            </li>
          ))}
        </ul>
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
