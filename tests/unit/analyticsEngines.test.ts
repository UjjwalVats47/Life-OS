import { describe, expect, it } from "vitest";
import { analyzeScheduleBehavior } from "@/system/analytics/behaviorPatternEngine";
import { createExplainableInsights, createSystemCommentary } from "@/system/analytics/insightEngine";
import { calculateProductivityRhythm } from "@/system/analytics/productivityEngine";

describe("analytics engines", () => {
  it("finds productive and avoidance-heavy windows from evidence", () => {
    const result = calculateProductivityRhythm([
      { completed: true, hour: 9, postponed: false },
      { completed: true, hour: 10, postponed: false },
      { completed: false, hour: 19, postponed: true }
    ]);

    expect(result.bestWindow).toBe("Morning");
    expect(result.weakestWindow).toBe("Evening");
  });

  it("turns rates into schedule patterns and commentary", () => {
    expect(
      analyzeScheduleBehavior({
        completionRate: 0.4,
        fixedCommitmentAttempts: 5,
        fixedCommitmentFailures: 2,
        postponementRate: 0.4
      }).filter((pattern) => pattern.severity === "warning")
    ).toHaveLength(3);
    expect(
      createSystemCommentary({
        completionRate: 0.9,
        highStressSpending: 500,
        postponementRate: 0.05
      })
    ).toHaveLength(2);
  });

  it("creates explainable insights with confidence, evidence, alternatives, and one experiment", () => {
    const result = createExplainableInsights({
      attempts: 8,
      bestWindow: "Morning",
      bestWindowAttempts: 5,
      completionRate: 0.5,
      deadlinePrepItems: 4,
      highStressSpending: 0,
      postponementRate: 0.5,
      unfinishedDeadlinePrepItems: 3
    });

    expect(result.recommendedExperiment).toBeTruthy();
    expect(result.insights).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          confidence: "medium",
          sampleSize: 8,
          severity: "warning",
          title: "Postponement pressure is rising"
        }),
        expect.objectContaining({
          alternativeExplanation: expect.stringContaining("deadline"),
          severity: "critical",
          title: "Deadline trajectory needs attention"
        })
      ])
    );
  });
});
