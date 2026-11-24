const XP_PER_CORRECT = 10;
const PERFECT_BONUS = 10;

// Scores one finished lesson run. Pure function: no database, no clock.
export function scoreRun({ total, correctCount }) {
  const correct = Math.max(0, Math.min(total, correctCount));
  const perfect = total > 0 && correct === total;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const xpAwarded = correct * XP_PER_CORRECT + (perfect ? PERFECT_BONUS : 0);
  return { correct, wrong: total - correct, perfect, accuracy, xpAwarded };
}
