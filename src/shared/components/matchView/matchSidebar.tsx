"use client";

import { useState } from 'react';
import type { Buyer, Seller, MatchDimension, MatchWeights } from '../../../app/lib/types';
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
  buyers: Buyer[];
  sellers: Seller[];
  anchorId: string | null;
  onAnchorChange: (id: string) => void;
  pickerScores: Map<string, number | null>;
  onPrint: () => void;
}

function SectionHeader({
  title,
  open,
  onToggle,
  children,
}: {
  title: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="match-section-header"
      onClick={onToggle}
      aria-expanded={open}
    >
      {title}
      {children}
      <span className={`match-section-chevron${open ? ' match-section-chevron--open' : ''}`}>
        ‹
      </span>
    </button>
  );
}

export default function MatchSidebar({
  pivot,
  onPivotChange,
  weights,
  onWeightChange,
  dealbreakers,
  onDealbreakersChange,
  buyers,
  sellers,
  anchorId,
  onAnchorChange,
  pickerScores,
  onPrint,
}: MatchSidebarProps) {
  const [openView, setOpenView] = useState(true);
  const [openPicker, setOpenPicker] = useState(true);
  const [openWeights, setOpenWeights] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

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

  const visibleItems = pickerItems.slice(0, visibleCount);
  const remaining = pickerItems.length - visibleCount;

  return (
    <aside className="match-sidebar">

      <div className="match-sidebar-section">
        <SectionHeader title={<span className="match-sidebar-title">View</span>} open={openView} onToggle={() => setOpenView((v) => !v)} />
        {openView && (
          <div className="match-pivot-group">
            <button
              type="button"
              className={`match-pivot-btn${pivot === 'buyer-first' ? ' match-pivot-btn--active' : ''}`}
              onClick={() => { onPivotChange('buyer-first'); setVisibleCount(10); }}
            >
              Buyer-first
            </button>
            <button
              type="button"
              className={`match-pivot-btn${pivot === 'seller-first' ? ' match-pivot-btn--active' : ''}`}
              onClick={() => { onPivotChange('seller-first'); setVisibleCount(10); }}
            >
              Seller-first
            </button>
          </div>
        )}
      </div>

      <div className="match-sidebar-section">
        <SectionHeader
          title={<span className="match-sidebar-title">{isBuyerFirst ? 'Buyers' : 'Sellers'}</span>}
          open={openPicker}
          onToggle={() => { setOpenPicker((v) => !v); setVisibleCount(10); }}
        />
        {openPicker && (
          <div className="match-picker">
            {pickerItems.length === 0 && (
              <span className="match-empty match-empty--sm">
                No {isBuyerFirst ? 'buyers' : 'sellers'} found.
              </span>
            )}
            {visibleItems.map((item) => (
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
            {remaining > 0 && (
              <button
                type="button"
                className="match-picker-load-more"
                onClick={() => setVisibleCount((c) => c + 10)}
              >
                · · · Load more ({remaining} remaining)
              </button>
            )}
          </div>
        )}
      </div>

      <div className="match-sidebar-section">
        <SectionHeader
          open={openWeights}
          onToggle={() => setOpenWeights((v) => !v)}
          title={<span className="match-sidebar-title">Weights</span>}
        >
          {openWeights && (
            <div className="match-db-header" onClick={(e) => e.stopPropagation()}>
              <span className="match-db-label">DB</span>
              <span className="match-db-hint" tabIndex={0}>(?)</span>
              <div className="match-db-tooltip" role="tooltip">
                <strong>Dealbreaker</strong>
                <span>If this dimension scores 0, the match is automatically excluded.</span>
              </div>
            </div>
          )}
        </SectionHeader>
        {openWeights && DIMENSIONS.map((dim) => {
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
