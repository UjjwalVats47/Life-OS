import { db } from "@/db/lifeOsDb";
import { defaultUserProfileId } from "@/db/repositories/profileRepo";
import { createId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import { analyzeScheduleBehavior } from "@/system/analytics/behaviorPatternEngine";
import { createExplainableInsights, createSystemCommentary } from "@/system/analytics/insightEngine";
import { calculateProductivityRhythm } from "@/system/analytics/productivityEngine";

export async function loadHunterLog() {
  const userId = defaultUserProfileId;
  const [attempts, slots, goals, moods, finance, insights, eventPrepItems] = await Promise.all([
    db.taskAttempts.where("userId").equals(userId).toArray(),
    db.questSlots.where("userId").equals(userId).toArray(),
    db.goals.where("userId").equals(userId).toArray(),
    db.moodStressEntries.where("userId").equals(userId).toArray(),
    db.financeEntries.where("userId").equals(userId).toArray(),
    db.systemInsights.where("userId").equals(userId).toArray(),
    db.eventPrepItems.where("userId").equals(userId).toArray()
  ]);
  const observations = attempts.map((attempt) => {
    const date = new Date(attempt.finishedAt ?? attempt.startedAt ?? attempt.createdAt);
    return {
      completed: attempt.status === "completed",
      hour: date.getHours(),
      postponed: attempt.status === "postponed" || attempt.status === "incomplete"
    };
  });
  const rhythm = calculateProductivityRhythm(observations);
  const completed = attempts.filter((attempt) => attempt.status === "completed").length;
  const postponed = attempts.filter(
    (attempt) => attempt.status === "postponed" || attempt.status === "incomplete"
  ).length;
  const completionRate = attempts.length ? completed / attempts.length : 0;
  const postponementRate = attempts.length ? postponed / attempts.length : 0;
  const stressById = new Map(moods.map((entry) => [entry.id, entry.stress]));
  const financeStress = [
    { label: "Low", total: 0 },
    { label: "Moderate", total: 0 },
    { label: "High", total: 0 }
  ];

  for (const entry of finance) {
    const stress = entry.moodStressEntryId ? stressById.get(entry.moodStressEntryId) : undefined;
    const bucket = stress === undefined || stress <= 3 ? 0 : stress <= 6 ? 1 : 2;
    financeStress[bucket].total += entry.amount;
  }

  const highStressSpending = financeStress[2].total;
  const schedulePatterns = analyzeScheduleBehavior({
    completionRate,
    fixedCommitmentAttempts: slots.length,
    fixedCommitmentFailures: attempts.filter((attempt) => attempt.status === "failed").length,
    postponementRate
  });
  const commentary = createSystemCommentary({
    bestWindow: rhythm.bestWindow,
    completionRate,
    highStressSpending,
    postponementRate
  });
  const bestBucket = rhythm.buckets.find((bucket) => bucket.label === rhythm.bestWindow);
  const weakestBucket = rhythm.buckets.find((bucket) => bucket.label === rhythm.weakestWindow);
  const unfinishedDeadlinePrepItems = eventPrepItems.filter((item) =>
    item.status === "draft" || item.status === "approved" || item.status === "scheduled" || item.status === "skipped"
  ).length;
  const explainable = createExplainableInsights({
    attempts: attempts.length,
    bestWindow: rhythm.bestWindow,
    bestWindowAttempts: bestBucket?.attempts,
    completionRate,
    deadlinePrepItems: eventPrepItems.length,
    highStressSpending,
    postponementRate,
    unfinishedDeadlinePrepItems,
    weakestWindowAttempts: weakestBucket?.attempts
  });

  return {
    commentary,
    completionRate: Math.round(completionRate * 100),
    explainableInsights: explainable.insights,
    financeStress,
    goals: goals.map((goal) => ({ name: goal.title, progress: goal.progress, system: goal.system })),
    moodTrend: moods
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(-14)
      .map((entry) => ({ date: entry.date, mood: entry.mood, stress: entry.stress })),
    postponementRate: Math.round(postponementRate * 100),
    rhythm,
    schedulePatterns,
    recommendedExperiment: explainable.recommendedExperiment,
    savedInsights: insights.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  };
}

export async function rebuildDerivedInsights() {
  const userId = defaultUserProfileId;
  const state = await loadHunterLog();
  const timestamp = nowIso();

  await db.transaction("rw", db.systemInsights, async () => {
    await db.systemInsights
      .where("userId")
      .equals(userId)
      .filter((insight) => insight.insightType === "explainable_hunter_log")
      .delete();
    await db.systemInsights.bulkPut(
      state.explainableInsights.map((insight) => ({
        body: `${insight.evidence} Alternative: ${insight.alternativeExplanation} Experiment: ${insight.experiment}`,
        createdAt: timestamp,
        date: timestamp.slice(0, 10),
        id: createId(),
        insightType: "explainable_hunter_log",
        severity: insight.severity,
        sourceRefs: [`sample:${insight.sampleSize}`, `confidence:${insight.confidence}`],
        title: insight.title,
        updatedAt: timestamp,
        userId
      }))
    );
  });

  return state.explainableInsights.length;
}

export async function clearDerivedHunterLogInsights() {
  const userId = defaultUserProfileId;
  return db.systemInsights
    .where("userId")
    .equals(userId)
    .filter((insight) => insight.insightType === "explainable_hunter_log")
    .delete();
}
