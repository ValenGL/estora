"use client";

import type { MatchPairResult } from '../../../app/lib/types';
import MatchCard from './matchCard';

interface MatchPanelProps {
  results: MatchPairResult[];
}

export default function MatchPanel({ results }: MatchPanelProps) {
  return (
    <div className="match-panel">
      <div className="match-list">
        {results.length === 0 && (
          <span className="match-empty">No matches to display.</span>
        )}
        {results.map((result, i) => (
          <MatchCard key={i} result={result} />
        ))}
      </div>
    </div>
  );
}
