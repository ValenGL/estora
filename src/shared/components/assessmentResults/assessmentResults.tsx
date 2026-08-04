"use client";

import { ASSESSMENT_CATEGORIES } from '../../../app/lib/data/sellerAssessment';
import {
  calcCategoryScore,
  calcOverallScore,
  getScoreLabel,
  getStarRating,
} from '../../../app/lib/utils/scoring';
import "./assessmentResults.scss";

interface AssessmentResultsProps {
  answers: Record<number, number>;
  businessName: string;
  onFinish: () => void;
}

function Stars({ count }: { count: number }) {
  return (
    <span className="results-category-card__stars">
      {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </span>
  );
}

export default function AssessmentResults({
  answers,
  businessName,
  onFinish,
}: AssessmentResultsProps) {
  const overall = calcOverallScore(answers);
  const label = getScoreLabel(overall);

  const categoryResults = ASSESSMENT_CATEGORIES.map((cat, i) => ({
    name: cat.name,
    score: calcCategoryScore(i, answers),
  }));

  return (
    <div className="assessment-results">
      <div className="results-hero">
        <span className="results-hero__eyebrow">
          Investment-Grade Readiness Assessment
        </span>
        {businessName && (
          <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>{businessName}</p>
        )}
        <div className="results-hero__score">{Math.round(overall)}%</div>
        <p className="results-hero__label">{label}</p>
      </div>

      <div className="results-grid">
        {categoryResults.map((cat) => {
          const stars = getStarRating(cat.score);
          return (
            <div key={cat.name} className="results-category-card">
              <span className="results-category-card__name">{cat.name}</span>
              <span className="results-category-card__score">
                {Math.round(cat.score)}%
              </span>
              <Stars count={stars} />
              <span className="results-category-card__label">
                {getScoreLabel(cat.score)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="results-actions">
        <button
          className="results-btn results-btn--print"
          onClick={() => window.print()}
          type="button"
        >
          Print results
        </button>
        <button
          className="results-btn results-btn--finish"
          onClick={onFinish}
          type="button"
        >
          Go to dashboard →
        </button>
      </div>
    </div>
  );
}
