import { describe, expect, it } from "vitest";
import {
  generateGoalTaskIntelligence,
  inferGoalArchetype,
  isGeneratedTaskEligible,
  validateGeneratedTask
} from "@/system/tasks/goalTaskIntelligenceEngine";
import type { Goal, TaskTemplate } from "@/types/domain";

const codingGoal: Goal = {
  createdAt: "2026-07-30T00:00:00.000Z",
  deadlineAt: "2027-01-30T00:00:00.000Z",
  domain: "skills_career",
  id: "goal-coding",
  importance: "critical",
  level: "primary",
  priorityWeight: 100,
  progress: 0,
  reason: "Become capable of building software independently",
  status: "active",
  system: "sys1",
  timelineMonths: 6,
  title: "Become good at coding",
  updatedAt: "2026-07-30T00:00:00.000Z",
  userId: "user-1"
};

describe("goalTaskIntelligenceEngine", () => {
  it("turns a coding goal into concrete, verifiable actions instead of repeating the goal", () => {
    const result = generateGoalTaskIntelligence({ goal: codingGoal });

    expect(result.plan.archetype).toBe("coding");
    expect(result.plan.capabilities.map((item) => item.key)).toContain("debugging");
    expect(result.tasks.length).toBeGreaterThanOrEqual(5);
    expect(result.tasks.some((task) => /advance|practice coding/i.test(task.title))).toBe(false);
    expect(result.tasks.some((task) => task.title.includes("practice set with solutions"))).toBe(true);
    expect(result.tasks.every((task) => validateGeneratedTask(task).valid)).toBe(true);
    expect(result.tasks.every((task) => Boolean(task.completionEvidence))).toBe(true);
  });

  it("keeps dependent work locked until its proof task is completed", () => {
    const result = generateGoalTaskIntelligence({ goal: codingGoal });
    const baseline = result.tasks.find((task) => task.taskKey === "coding-baseline") as TaskTemplate;

    expect(isGeneratedTaskEligible(baseline, new Set())).toBe(false);
    expect(isGeneratedTaskEligible(baseline, new Set(["coding-resource"]))).toBe(true);
  });

  it("reduces long actions after repeated execution friction while preserving proof", () => {
    const normal = generateGoalTaskIntelligence({ goal: codingGoal });
    const adapted = generateGoalTaskIntelligence({
      goal: codingGoal,
      history: [
        { status: "postponed", taskKey: "old-1" },
        { status: "incomplete", taskKey: "old-2" }
      ],
      planVersion: 2
    });
    const normalOutput = normal.tasks.find((task) => task.taskKey === "coding-output")!;
    const adaptedOutput = adapted.tasks.find((task) => task.taskKey === "coding-output")!;

    expect(adaptedOutput.estimatedMinutes).toBeLessThan(normalOutput.estimatedMinutes);
    expect(adaptedOutput.completionEvidence).toContain("Minimum acceptable proof");
    expect(adapted.plan.assumptions.some((item) => item.includes("friction"))).toBe(true);
  });

  it("infers exam intent from goal language even when the domain is broad", () => {
    expect(inferGoalArchetype({ ...codingGoal, title: "Score 90% in semester physics exam" })).toBe("academic_exam");
  });

  it("uses explicit goal calibration in generated actions", () => {
    const result = generateGoalTaskIntelligence({
      goal: {
        ...codingGoal,
        availableResources: "Laptop, Python 3, offline notes",
        constraints: "Offline only and at most 60 minutes per weekday",
        currentLevel: "Beginner who knows variables and loops",
        targetOutcome: "Solve intermediate Python problems and ship one command-line project"
      }
    });

    expect(result.plan.assumptions.join(" ")).toContain("Beginner who knows variables and loops");
    expect(result.plan.interpretation).toContain("Solve intermediate Python problems");
    expect(result.tasks[0].instructions.join(" ")).toContain("Offline only");
    expect(result.tasks[0].resourceQuery).toContain("Beginner who knows variables and loops");
  });

  it("creates a new dependency-safe cycle after every action in the prior cycle is complete", () => {
    const first = generateGoalTaskIntelligence({ goal: codingGoal });
    const next = generateGoalTaskIntelligence({
      goal: codingGoal,
      history: first.tasks.map((task) => ({ status: "completed" as const, taskKey: task.taskKey })),
      planVersion: 2
    });
    const baseline = next.tasks.find((task) => task.actionType === "baseline_assessment")!;

    expect(next.tasks.length).toBe(first.tasks.length);
    expect(next.tasks.every((task) => task.taskKey?.endsWith("-cycle-2"))).toBe(true);
    expect(baseline.dependencyTaskKeys?.[0]).toBe("coding-resource-cycle-2");
  });

  it("raises challenge after repeated strong evidence", () => {
    const result = generateGoalTaskIntelligence({
      goal: codingGoal,
      history: [
        { actionType: "guided_practice", difficultyFeedback: "too_easy", resultScore: 92, status: "completed", taskKey: "old-a" },
        { actionType: "guided_practice", difficultyFeedback: "right", resultScore: 90, status: "completed", taskKey: "old-b" }
      ],
      planVersion: 2
    });
    const debugTask = result.tasks.find((task) => task.taskKey === "coding-debug")!;

    expect(debugTask.difficulty).toBe("hard");
    expect(debugTask.instructions.join(" ")).toContain("harder question set");
  });
});
