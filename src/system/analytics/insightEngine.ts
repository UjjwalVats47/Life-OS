export type CommentaryInput = {
  bestWindow?: string;
  completionRate: number;
  highStressSpending: number;
  postponementRate: number;
};

export type ExplainableInsightInput = CommentaryInput & {
  attempts: number;
  bestWindowAttempts?: number;
  deadlinePrepItems: number;
  unfinishedDeadlinePrepItems: number;
  weakestWindowAttempts?: number;
};

export type ExplainableInsight = {
  alternativeExplanation: string;
  confidence: "low" | "medium" | "high";
  evidence: string;
  experiment: string;
  observationWindow: string;
  sampleSize: number;
  severity: "positive" | "neutral" | "warning" | "critical";
  title: string;
};

export function createSystemCommentary(input: CommentaryInput) {
  const comments: string[] = [];

  if (input.completionRate >= 0.85) {
    comments.push("Current execution resembles a higher-rank operating pattern. Protect the routine that produced it.");
  } else if (input.completionRate < 0.5) {
    comments.push("The declared identity is ahead of the current proof. Reduce drift and finish the next assigned action.");
  }

  if (input.postponementRate > 0.3) {
    comments.push("Postponement is becoming a behavioral signature, not an isolated scheduling problem.");
  }

  if (input.bestWindow) {
    comments.push(`${input.bestWindow} currently produces the strongest completion evidence.`);
  }

  if (input.highStressSpending > 0) {
    comments.push("Some spending occurred during high stress. Review whether those purchases were recovery or avoidance.");
  }

  return comments.length
    ? comments
    : ["Insufficient evidence. Complete and postpone real quests before expecting psychological conclusions."];
}

export function createExplainableInsights(input: ExplainableInsightInput) {
  const insights: ExplainableInsight[] = [];
  const confidence = confidenceFromSample(input.attempts);

  if (input.attempts < 3) {
    insights.push({
      alternativeExplanation: "The current sample may reflect setup/testing rather than normal behavior.",
      confidence: "low",
      evidence: `${input.attempts} recorded task attempts in the current local database.`,
      experiment: "Complete or postpone three real quests before changing the schedule.",
      observationWindow: "All recorded attempts",
      sampleSize: input.attempts,
      severity: "neutral",
      title: "Insufficient behavioral evidence"
    });

    return { insights, recommendedExperiment: insights[0].experiment };
  }

  if (input.completionRate >= 0.85) {
    insights.push({
      alternativeExplanation: "The current tasks may be too easy or too few to prove durable capacity.",
      confidence,
      evidence: `${Math.round(input.completionRate * 100)}% completion across ${input.attempts} attempts.`,
      experiment: "Add one slightly harder identity-linked task during the current best window.",
      observationWindow: "All recorded attempts",
      sampleSize: input.attempts,
      severity: "positive",
      title: "Execution pattern is stable"
    });
  }

  if (input.postponementRate > 0.3) {
    insights.push({
      alternativeExplanation: "Postponement may come from unrealistic duration estimates, not pure avoidance.",
      confidence,
      evidence: `${Math.round(input.postponementRate * 100)}% postponement across ${input.attempts} attempts.`,
      experiment: "For the next three flexible tasks, reduce planned duration by 15% and require a reason if postponed.",
      observationWindow: "All recorded attempts",
      sampleSize: input.attempts,
      severity: input.postponementRate > 0.5 ? "critical" : "warning",
      title: "Postponement pressure is rising"
    });
  }

  if (input.bestWindow) {
    insights.push({
      alternativeExplanation: "The stronger window may simply contain easier tasks.",
      confidence: confidenceFromSample(input.bestWindowAttempts ?? input.attempts),
      evidence: `${input.bestWindow} has the strongest completion evidence so far.`,
      experiment: `Place one priority quest in ${input.bestWindow} for the next two active days.`,
      observationWindow: "Grouped by task start/finish hour",
      sampleSize: input.bestWindowAttempts ?? input.attempts,
      severity: "positive",
      title: "Best execution window detected"
    });
  }

  if (input.unfinishedDeadlinePrepItems > 0) {
    insights.push({
      alternativeExplanation: "The deadline may be low priority, or prep items may have been generated too early.",
      confidence: confidenceFromSample(input.deadlinePrepItems),
      evidence: `${input.unfinishedDeadlinePrepItems} of ${input.deadlinePrepItems} deadline-prep items are unfinished.`,
      experiment: "Promote one deadline-prep item into the next available fixed or high-priority flexible slot.",
      observationWindow: "Current event preparation plan",
      sampleSize: input.deadlinePrepItems,
      severity: input.unfinishedDeadlinePrepItems >= 3 ? "critical" : "warning",
      title: "Deadline trajectory needs attention"
    });
  }

  if (input.highStressSpending > 0) {
    insights.push({
      alternativeExplanation: "Some high-stress spending may be valid recovery or necessary expense.",
      confidence: "low",
      evidence: `${input.highStressSpending} total spending was linked to high stress entries.`,
      experiment: "Before the next discretionary purchase, add a 30-second mood/stress log first.",
      observationWindow: "Recorded finance entries with mood/stress links",
      sampleSize: 1,
      severity: "warning",
      title: "Stress spending signal exists"
    });
  }

  const resolvedInsights = insights.length
    ? insights
    : [
        {
          alternativeExplanation: "The current behavior may be balanced, or evidence may still be too narrow.",
          confidence,
          evidence: `${input.attempts} attempts with no dominant warning pattern.`,
          experiment: "Keep the current structure for two more active days and compare completion timing.",
          observationWindow: "All recorded attempts",
          sampleSize: input.attempts,
          severity: "neutral" as const,
          title: "No dominant pattern yet"
        }
      ];

  return {
    insights: resolvedInsights,
    recommendedExperiment: pickRecommendedExperiment(resolvedInsights)
  };
}

function confidenceFromSample(sampleSize: number): ExplainableInsight["confidence"] {
  if (sampleSize >= 12) return "high";
  if (sampleSize >= 5) return "medium";
  return "low";
}

function pickRecommendedExperiment(insights: ExplainableInsight[]) {
  const priority = {
    critical: 4,
    neutral: 1,
    positive: 2,
    warning: 3
  };
  return [...insights].sort((a, b) => priority[b.severity] - priority[a.severity])[0].experiment;
}
