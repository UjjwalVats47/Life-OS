import { db } from "@/db/lifeOsDb";
import { rankThresholds } from "@/db/seed";
import { defaultUserProfileId } from "@/db/repositories/profileRepo";
import type { FirstWeekProtocol } from "@/system/awakening/firstWeekProtocol";
import type { StatName } from "@/types/enums";

export type DashboardSummary = {
  activeIdentity?: string;
  activeRank: string;
  displayName: string;
  lifetimeXp: number;
  nextRank: string;
  nextRankXp: number;
  onboardingCompleted: boolean;
  pendingQuests: number;
  rankProgress: number;
  resetPoints: number;
  stats: Record<StatName, number>;
  streak: number;
  firstWeekProtocol?: FirstWeekProtocol;
  workItemCount: number;
};

export async function loadDashboardSummary(): Promise<DashboardSummary> {
  const userId = defaultUserProfileId;
  const profile = await db.userProfiles.get(userId);
  const identity = profile?.activeIdentityPathId
    ? await db.identityPaths.get(profile.activeIdentityPathId)
    : undefined;
  const xpLogs = await db.xpLogs.where("userId").equals(userId).toArray();
  const statLogs = await db.statLogs.where("userId").equals(userId).toArray();
  const resetLogs = await db.resetPointLogs.where("userId").equals(userId).toArray();
  const streak = await db.streaks
    .where("userId")
    .equals(userId)
    .filter((item) => item.streakType === "daily")
    .first();
  const rankSnapshot = await db.rankSnapshots.where("userId").equals(userId).last();
  const protocolMeta = await db.appMeta.get(`first-week-protocol-${userId}`);
  const workItemCount = await db.workItems.where("userId").equals(userId).count();
  const pendingQuests = await db.questSlots
    .where("userId")
    .equals(userId)
    .filter((slot) => slot.status === "pending" || slot.status === "active")
    .count();
  const lifetimeXp = xpLogs.reduce((sum, log) => sum + log.amount, 0);
  const unlockedIndex = rankThresholds.reduce(
    (index, threshold, candidateIndex) => (lifetimeXp >= threshold.xp ? candidateIndex : index),
    0
  );
  const currentThreshold = rankThresholds[unlockedIndex];
  const nextThreshold = rankThresholds[Math.min(rankThresholds.length - 1, unlockedIndex + 1)];
  const rankSpan = Math.max(1, nextThreshold.xp - currentThreshold.xp);
  const rankProgress =
    unlockedIndex === rankThresholds.length - 1
      ? 100
      : Math.round(((lifetimeXp - currentThreshold.xp) / rankSpan) * 100);
  const stats: Record<StatName, number> = {
    discipline: 1,
    focus: 1,
    intelligence: 1,
    perception: 1,
    vitality: 1
  };

  for (const log of statLogs) {
    stats[log.stat] += log.amount;
  }

  return {
    activeIdentity: identity?.name,
    activeRank: rankSnapshot?.activeRank ?? currentThreshold.rank,
    displayName: profile?.displayName ?? "Hunter",
    lifetimeXp,
    nextRank: nextThreshold.rank,
    nextRankXp: nextThreshold.xp,
    onboardingCompleted: profile?.onboardingCompleted ?? false,
    pendingQuests,
    rankProgress,
    resetPoints: resetLogs.reduce((sum, log) => sum + log.amount, 0),
    stats,
    streak: streak?.currentCount ?? 0,
    firstWeekProtocol: isFirstWeekProtocol(protocolMeta?.value) ? protocolMeta.value : undefined,
    workItemCount
  };
}

function isFirstWeekProtocol(value: unknown): value is FirstWeekProtocol {
  return Boolean(
    value &&
      typeof value === "object" &&
      "days" in value &&
      Array.isArray((value as FirstWeekProtocol).days) &&
      "evidenceRules" in value &&
      Array.isArray((value as FirstWeekProtocol).evidenceRules)
  );
}
