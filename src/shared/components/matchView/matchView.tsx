"use client";

import { useState, useMemo } from 'react';
import type { Buyer, Seller, MatchWeights, MatchDimension } from '../../../app/lib/types';
import { DEFAULT_WEIGHTS, scoreAllSellers, scoreAllBuyers } from '../../../app/lib/utils/matching';
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

  return (
    <div className="match-view">
      <div className="match-print-header">
        <h2 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Match Report</h2>
        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
          {new Date().toLocaleString()} — {pivot === 'buyer-first' ? 'Buyer-first' : 'Seller-first'}
        </p>
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
