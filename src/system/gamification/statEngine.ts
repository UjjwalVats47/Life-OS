import type { CompletionTiming, TaskDifficulty, XpTaskCategory } from "@/system/gamification/xpEngine";
import { difficultyMultiplier, timelinessMultiplier } from "@/system/gamification/xpEngine";
import type { StatName } from "@/types/enums";

const baseStatPoints: Record<XpTaskCategory, number> = {
  small: 1,
  negotiable: 2,
  critical: 4,
  deadline_prep: 5,
  phase3: 6
};

export function normalizeStatWeights(weights: Partial<Record<StatName, number>>) {
  const positiveWeights = Object.entries(weights).filter((entry): entry is [StatName, number] => entry[1] > 0);
  const total = positiveWeights.reduce((sum, [, value]) => sum + value, 0);

  if (total === 0) {
    return {};
  }

  return Object.fromEntries(positiveWeights.map(([key, value]) => [key, value / total])) as Partial<
    Record<StatName, number>
  >;
}

export function calculateStatPoints(
  category: XpTaskCategory,
  difficulty: TaskDifficulty,
  timing: CompletionTiming
) {
  return Math.max(
    0,
    Math.round(baseStatPoints[category] * difficultyMultiplier[difficulty] * timelinessMultiplier[timing])
  );
}

export function allocateStatPoints(totalPoints: number, weights: Partial<Record<StatName, number>>) {
  const normalized = normalizeStatWeights(weights);
  const entries = Object.entries(normalized) as Array<[StatName, number]>;

  if (totalPoints <= 0 || entries.length === 0) {
    return {};
  }

  const exact = entries.map(([stat, weight]) => {
    const value = totalPoints * weight;
    return { floor: Math.floor(value), remainder: value % 1, stat };
  });
  let pointsLeft = totalPoints - exact.reduce((sum, item) => sum + item.floor, 0);

  exact.sort((a, b) => b.remainder - a.remainder || a.stat.localeCompare(b.stat));
  const awards: Partial<Record<StatName, number>> = {};

  for (const item of exact) {
    awards[item.stat] = item.floor + (pointsLeft > 0 ? 1 : 0);
    pointsLeft -= pointsLeft > 0 ? 1 : 0;
  }

  return awards;
}

export function calculateStatAwards(
  category: XpTaskCategory,
  difficulty: TaskDifficulty,
  timing: CompletionTiming,
  weights: Partial<Record<StatName, number>>
) {
  return allocateStatPoints(calculateStatPoints(category, difficulty, timing), weights);
}
