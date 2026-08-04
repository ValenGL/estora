"use client";

import { ASSESSMENT_CATEGORIES } from '../../../app/lib/data/sellerAssessment';
import { getStartIndex } from '../../../app/lib/utils/scoring';
import "./assessmentStep.scss";

interface AssessmentStepProps {
  categoryIndex: number;
  answers: Record<number, number>;
  onAnswer: (questionIndex: number, score: number) => void;
  onNext: () => void;
  onBack?: () => void;
}

export default function AssessmentStep({
  categoryIndex,
  answers,
  onAnswer,
  onNext,
  onBack,
}: AssessmentStepProps) {
  const category = ASSESSMENT_CATEGORIES[categoryIndex];
  const startIndex = getStartIndex(categoryIndex);
  const totalCategories = ASSESSMENT_CATEGORIES.length;

  const allAnswered = category.questions.every(
    (_, i) => answers[startIndex + i] !== undefined
  );

  return (
    <div className="assessment-step">
      <div className="assessment-progress">
        <span className="assessment-progress__label">
          Step {categoryIndex + 1} of {totalCategories}
        </span>
        <div className="assessment-progress__bar">
          <div
            className="assessment-progress__fill"
            style={{ width: `${((categoryIndex + 1) / totalCategories) * 100}%` }}
          />
        </div>
      </div>

      <h2 className="assessment-category-title">{category.name}</h2>

      <div className="assessment-questions">
        {category.questions.map((question, qi) => {
          const globalIndex = startIndex + qi;
          const selectedScore = answers[globalIndex];

          return (
            <div key={qi} className="assessment-question">
              <p className="assessment-question__text">{question.text}</p>
              <div className="assessment-question__options">
                {question.options.map((option) => (
                  <button
                    key={option.score}
                    className={`assessment-option${selectedScore === option.score ? ' assessment-option--selected' : ''}`}
                    onClick={() => onAnswer(globalIndex, option.score)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="assessment-nav">
        {onBack ? (
          <button className="assessment-btn" onClick={onBack} type="button">
            ← Back
          </button>
        ) : (
          <span />
        )}
        <button
          className="assessment-btn assessment-btn--primary"
          onClick={onNext}
          disabled={!allAnswered}
          type="button"
        >
          {categoryIndex === totalCategories - 1 ? 'Continue →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
