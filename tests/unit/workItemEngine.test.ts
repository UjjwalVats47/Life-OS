import { describe, expect, it } from "vitest";
import { projectWorkItemsFromRecords } from "@/system/work/workItemEngine";
import { createFirstWeekProtocol } from "@/system/awakening/firstWeekProtocol";
import { adaptWorkItemsToWindow, chooseAdaptationMode } from "@/system/scheduling/boundedScheduleAdapter";
import type { Goal, Habit, WorkItem } from "@/types/domain";

const timestamp = "2026-07-30T10:00:00.000Z";
const userId = "local-user";

describe("v2 work model engines", () => {
  it("projects existing records into shared work items", () => {
    const goal = makeGoal({ id: "goal-1", level: "primary", title: "Become stronger at coding" });
    const habit = makeHabit({ goalId: goal.id, id: "habit-1", title: "Daily problem solving" });
    const workItems = projectWorkItemsFromRecords({
      commitments: [
        {
          commitmentType: "flexible",
          createdAt: timestamp,
          dayOfWeek: 4,
          domain: "skills_career",
          endTime: "20:00",
          goalId: goal.id,
          id: "commitment-1",
          startTime: "18:00",
          title: "Coding block",
          updatedAt: timestamp,
          userId
        }
      ],
      eventPrepItems: [],
      events: [],
      goals: [goal],
      habits: [habit],
      questSlots: [],
      scheduleBlocks: [],
      taskAttempts: [],
      taskTemplates: [],
      timestamp,
      userId
    });

    expect(workItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          flexibility: "bounded",
          goalId: goal.id,
          id: "work-commitment-commitment-1",
          kind: "flexible_commitment",
          plannedMinutes: 120,
          priority: "critical",
          resetEligible: true,
          resetPointValue: 8
        }),
        expect.objectContaining({
          habitId: habit.id,
          id: "work-habit-habit-1",
          resetPointValue: 3,
          sourceType: "habit"
        })
      ])
    );
  });

  it("creates a first-week protocol that starts with observation and ends with review", () => {
    const protocol = createFirstWeekProtocol({
      goals: [makeGoal({ domain: "skills_career", id: "goal-1", level: "primary" })],
      habits: [makeHabit({ domain: "discipline_routine", id: "habit-1" })],
      identityName: "Focused Builder",
      startDate: "2026-07-30",
      userId
    });

    expect(protocol.createdForIdentity).toBe("Focused Builder");
    expect(protocol.days).toHaveLength(7);
    expect(protocol.days[0]).toMatchObject({ intensity: "observe", maxPriorityQuests: 2 });
    expect(protocol.days[6]).toMatchObject({ focus: "recovery", intensity: "review" });
  });

  it("adapts flexible work inside bounds and keeps locked blocks untouched", () => {
    const result = adaptWorkItemsToWindow(
      [
        makeWorkItem({ flexibility: "locked", id: "school", plannedMinutes: 360, priority: "critical" }),
        makeWorkItem({
          flexibility: "bounded",
          id: "coding",
          maximumMinutes: 130,
          minimumMinutes: 90,
          plannedMinutes: 120,
          preferredMinutes: 120,
          priority: "high"
        }),
        makeWorkItem({
          flexibility: "bounded",
          id: "routine",
          maximumMinutes: 45,
          minimumMinutes: 20,
          plannedMinutes: 30,
          preferredMinutes: 30,
          priority: "normal"
        })
      ],
      490,
      "tighten"
    );

    expect(result.items.find((item) => item.id === "school")?.adjustedMinutes).toBe(360);
    expect(result.items.find((item) => item.id === "coding")?.adjustedMinutes).toBe(108);
    expect(result.items.find((item) => item.id === "routine")?.adjustedMinutes).toBe(22);
    expect(chooseAdaptationMode({ completionRate: 0.4, deadlinePressure: 0.2, postponementRate: 0.4 })).toBe("tighten");
  });
});

function makeGoal(overrides: Partial<Goal>): Goal {
  return {
    createdAt: timestamp,
    domain: "skills_career",
    id: "goal",
    importance: "critical",
    level: "primary",
    priorityWeight: 100,
    progress: 0,
    reason: "Identity proof",
    status: "active",
    system: "sys1",
    title: "Goal",
    updatedAt: timestamp,
    userId,
    ...overrides
  };
}

function makeHabit(overrides: Partial<Habit>): Habit {
  return {
    createdAt: timestamp,
    difficulty: "normal",
    domain: "skills_career",
    frequency: "daily",
    id: "habit",
    status: "active",
    title: "Habit",
    updatedAt: timestamp,
    userId,
    ...overrides
  };
}

function makeWorkItem(overrides: Partial<WorkItem>): WorkItem {
  return {
    createdAt: timestamp,
    flexibility: "bounded",
    id: "work",
    kind: "quest",
    plannedMinutes: 30,
    preferredMinutes: 30,
    priority: "normal",
    resetEligible: false,
    resetPointValue: 0,
    sourceType: "manual",
    statWeights: {},
    status: "planned",
    title: "Work",
    updatedAt: timestamp,
    userId,
    ...overrides
  };
}
