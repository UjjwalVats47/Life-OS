export type BehaviorPatternInput = {
  completionRate: number;
  fixedCommitmentAttempts: number;
  fixedCommitmentFailures: number;
  postponementRate: number;
};

export function analyzeScheduleBehavior(input: BehaviorPatternInput) {
  const fixedFailureRate = input.fixedCommitmentAttempts
    ? input.fixedCommitmentFailures / input.fixedCommitmentAttempts
    : 0;
  const patterns: Array<{ severity: "positive" | "neutral" | "warning"; text: string }> = [];

  if (input.completionRate >= 0.8) {
    patterns.push({ severity: "positive", text: "The current workload is producing reliable completion." });
  } else if (input.completionRate < 0.5) {
    patterns.push({ severity: "warning", text: "The schedule is assigning more than current behavior can reliably execute." });
  }

  if (input.postponementRate > 0.3) {
    patterns.push({ severity: "warning", text: "Repeated postponement indicates avoidance or unrealistic slot placement." });
  }

  if (fixedFailureRate > 0.35) {
    patterns.push({ severity: "warning", text: "Fixed commitments are failing often enough to require schedule review." });
  }

  if (!patterns.length) {
    patterns.push({ severity: "neutral", text: "More behavioral evidence is needed before changing the schedule." });
  }

  return patterns;
}
