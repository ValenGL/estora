"use client";

import type { MatchDimension, MatchWeights } from '../../../app/lib/types';
import { DIMENSION_LABELS } from '../../../app/lib/utils/matching';

type PivotMode = 'buyer-first' | 'seller-first';

const DIMENSIONS = Object.keys(DIMENSION_LABELS) as MatchDimension[];

interface MatchSidebarProps {
  pivot: PivotMode;
  onPivotChange: (mode: PivotMode) => void;
  weights: MatchWeights;
  onWeightChange: (dim: MatchDimension, value: number) => void;
  dealbreakers: Set<MatchDimension>;
  onDealbreakersChange: (dim: MatchDimension) => void;
  onPrint: () => void;
}

export default function MatchSidebar({
  pivot,
  onPivotChange,
  weights,
  onWeightChange,
  dealbreakers,
  onDealbreakersChange,
  onPrint,
}: MatchSidebarProps) {
  return (
    <aside className="match-sidebar">

      <div className="match-sidebar-section">
        <span className="match-sidebar-title">View</span>
        <div className="match-pivot-group">
          <button
            type="button"
            className={`match-pivot-btn${pivot === 'buyer-first' ? ' match-pivot-btn--active' : ''}`}
            onClick={() => onPivotChange('buyer-first')}
          >
            Buyer-first
          </button>
          <button
            type="button"
            className={`match-pivot-btn${pivot === 'seller-first' ? ' match-pivot-btn--active' : ''}`}
            onClick={() => onPivotChange('seller-first')}
          >
            Seller-first
          </button>
        </div>
      </div>

      <div className="match-sidebar-section">
        <span className="match-sidebar-title">Weights</span>
        {DIMENSIONS.map((dim) => {
          const isBreaker = dealbreakers.has(dim);
          return (
            <div key={dim} className="match-dimension-row">
              <div className="match-dimension-label">
                <span className={`match-dimension-name${isBreaker ? ' match-dimension-name--breaker' : ''}`}>
                  {DIMENSION_LABELS[dim]}
                </span>
                <span className="match-dimension-value">{weights[dim]}</span>
              </div>
              <div className="match-dimension-slider-row">
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={weights[dim]}
                  onChange={(e) => onWeightChange(dim, Number(e.target.value))}
                  className="match-weight-slider"
                  aria-label={`Weight for ${DIMENSION_LABELS[dim]}`}
                />
                <input
                  type="checkbox"
                  checked={isBreaker}
                  onChange={() => onDealbreakersChange(dim)}
                  className="match-dimension-dealbreaker"
                  title="Dealbreaker"
                  aria-label={`Dealbreaker for ${DIMENSION_LABELS[dim]}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <button className="match-print-btn" onClick={onPrint} type="button">
        Print snapshot
      </button>

    </aside>
  );
}
