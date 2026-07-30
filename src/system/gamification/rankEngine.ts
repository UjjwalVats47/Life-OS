import { rankThresholds } from "@/db/seed";
import type { Rank } from "@/types/enums";

export function getUnlockedRank(lifetimeXp: number): Rank {
  return rankThresholds.reduce<Rank>((current, threshold) => {
    return lifetimeXp >= threshold.xp ? threshold.rank : current;
  }, "E");
}

export function getActiveRank(unlockedRank: Rank, recentBehaviorScore: number) {
  const rankOrder = rankThresholds.map((threshold) => threshold.rank);
  const unlockedIndex = rankOrder.indexOf(unlockedRank);
  const score = Math.min(100, Math.max(0, recentBehaviorScore));
  const drop = score < 50 ? 2 : score < 65 ? 1 : 0;

  return {
    activeRank: rankOrder[Math.max(0, unlockedIndex - drop)],
    unstable: score >= 65 && score < 80
  };
}
