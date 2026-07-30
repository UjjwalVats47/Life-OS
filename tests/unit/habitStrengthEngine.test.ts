import { describe, expect, it } from "vitest";
import { calculateHabitStrength } from "@/system/habits/habitStrengthEngine";
import type { Habit, TaskAttempt, TaskTemplate } from "@/types/domain";

const now = new Date("2026-07-30T12:00:00.000Z");
const timestamp = "2026-07-30T10:00:00.000Z";
const userId = "local-user";

describe("habitStrengthEngine", () => {
  it("scores improving habit evidence and missed-task pressure", () => {
    const habit = makeHabit();
    const template = makeTemplate(habit.id);
    const attempts: TaskAttempt[] = [
      makeAttempt("2026-07-20T10:00:00.000Z", "postponed", template.id),
      makeAttempt("2026-07-22T10:00:00.000Z", "completed", template.id),
      makeAttempt("2026-07-26T10:00:00.000Z", "completed", template.id),
      makeAttempt("2026-07-29T10:00:00.000Z", "completed", template.id)
    ];

    expect(calculateHabitStrength({ attempts, habit, now, templates: [template] })).toMatchObject({
      consistency: 75,
      missedCount: 1,
      momentum: "improving",
      pressure: "low",
      score: 64
    });
  });
});

function makeHabit(): Habit {
  return {
    createdAt: timestamp,
    difficulty: "normal",
    domain: "skills_career",
    frequency: "daily",
    id: "habit-1",
    status: "active",
    title: "Skill block",
    updatedAt: timestamp,
    userId
  };
}

function makeTemplate(habitId: string): TaskTemplate {
  return {
    baseXp: 10,
    category: "small",
    createdAt: timestamp,
    difficulty: "normal",
    domain: "skills_career",
    estimatedMinutes: 30,
    habitId,
    id: "template-1",
    statWeights: { focus: 50, intelligence: 50 },
    status: "active",
    title: "Skill block",
    updatedAt: timestamp,
    userId
  };
}

function makeAttempt(createdAt: string, status: TaskAttempt["status"], taskTemplateId: string): TaskAttempt {
  return {
    createdAt,
    id: `attempt-${createdAt}`,
    questSlotId: "slot-1",
    status,
    taskTemplateId,
    updatedAt: createdAt,
    userId
  };
}
