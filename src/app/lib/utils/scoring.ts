import { ASSESSMENT_CATEGORIES } from '../data/sellerAssessment';

export function getStartIndex(categoryIndex: number): number {
  return ASSESSMENT_CATEGORIES.slice(0, categoryIndex).reduce(
    (sum, cat) => sum + cat.questions.length,
    0
  );
}

export function calcCategoryScore(
  categoryIndex: number,
  answers: Record<number, number>
): number {
  const category = ASSESSMENT_CATEGORIES[categoryIndex];
  const startIndex = getStartIndex(categoryIndex);
  const n = category.questions.length;
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += answers[startIndex + i] ?? 0;
  }
  return (total / (n * 5)) * 100;
}

export function calcOverallScore(answers: Record<number, number>): number {
  const scores = ASSESSMENT_CATEGORIES.map((_, i) => calcCategoryScore(i, answers));
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

export function getScoreLabel(score: number): string {
  if (score >= 85) return 'Investment-Grade';
  if (score >= 70) return 'Strong Business with Targeted Upgrade Areas';
  if (score >= 55) return 'Optimization Opportunity';
  if (score >= 40) return 'Development Stage';
  return 'Not Ready';
}

export function getStarRating(score: number): number {
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 55) return 3;
  if (score >= 40) return 2;
  return 1;
}
