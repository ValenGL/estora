"use client";

import type { MatchDimension, MatchWeights } from '../../../app/lib/types';
import { DIMENSION_LABELS } from '../../../app/lib/utils/matching';

const DIMENSIONS = Object.keys(DIMENSION_LABELS) as MatchDimension[];

interface MatchSidebarProps {
  weights: MatchWeights;
  onWeightChange: (dim: MatchDimension, value: number) => void;
  dealbreakers: Set<MatchDimension>;
  onDealbreakersChange: (dim: MatchDimension) => void;
  onPrint: () => void;
}

export default function MatchSidebar({
  weights,
  onWeightChange,
  dealbreakers,
  onDealbreakersChange,
  onPrint,
}: MatchSidebarProps) {
  return (
    <aside className="match-sidebar">

      <div className="match-sidebar-section">
        <span className="match-sidebar-title">Weights</span>
        {DIMENSIONS.map((dim) => (
          <div key={dim} className="match-dimension-row">
            <div className="match-dimension-label">
              <span className="match-dimension-name">{DIMENSION_LABELS[dim]}</span>
              <span className="match-dimension-value">{weights[dim]}</span>
            </div>
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
          </div>
        ))}
      </div>

      <div className="match-sidebar-section">
        <span className="match-sidebar-title">Dealbreakers</span>
        {DIMENSIONS.map((dim) => {
          const active = dealbreakers.has(dim);
          return (
            <label
              key={dim}
              className={`match-dealbreaker-row${active ? ' match-dealbreaker-row--active' : ''}`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => onDealbreakersChange(dim)}
              />
              {DIMENSION_LABELS[dim]}
            </label>
          );
        })}
      </div>

      <button className="match-print-btn" onClick={onPrint} type="button">
        Print snapshot
      </button>

    </aside>
  );
}
