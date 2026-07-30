import { describe, expect, it } from "vitest";
import { createSundayPolicy } from "@/system/scheduling/sundayCatchup";

describe("sundayCatchup", () => {
  it("puts real deadline work first", () => {
    const policy = createSundayPolicy(
      [
        { deadlineRelated: false, estimatedMinutes: 45, id: "exercise", unfinished: true, urgency: 0.4 },
        { deadlineRelated: true, estimatedMinutes: 90, id: "exam-prep", unfinished: false, urgency: 0.9 }
      ],
      0.9
    );

    expect(policy.mode).toBe("deadline_priority");
    expect(policy.orderedTaskIds[0]).toBe("exam-prep");
  });

  it("adapts workload while protecting Sunday evening", () => {
    const unfinishedTasks = Array.from({ length: 4 }, (_, index) => ({
      deadlineRelated: false,
      estimatedMinutes: 45,
      id: `unfinished-${index}`,
      unfinished: true,
      urgency: 0.5
    }));

    expect(createSundayPolicy(unfinishedTasks, 0.5)).toMatchObject({
      eveningRestStartMinutes: 1080,
      mode: "heavy_catchup",
      workBudgetMinutes: 300
    });
    expect(createSundayPolicy([], 0.95).mode).toBe("light_recovery");
  });
});
