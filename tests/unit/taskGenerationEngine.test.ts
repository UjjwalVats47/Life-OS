import { describe, expect, it } from "vitest";
import { selectBestTaskOptions } from "@/system/tasks/taskGenerationEngine";

describe("taskGenerationEngine", () => {
  it("returns the two highest suited tasks that actually fit the slot", () => {
    const options = selectBestTaskOptions(
      [
        {
          deadlinePressure: 0.9,
          estimatedMinutes: 60,
          id: "exam-review",
          postponementCount: 1,
          preferredTimeMatch: 0.8,
          priorityWeight: 90,
          weakArea: true
        },
        {
          deadlinePressure: 0.2,
          estimatedMinutes: 45,
          id: "exercise",
          postponementCount: 0,
          preferredTimeMatch: 1,
          priorityWeight: 65,
          routine: true
        },
        {
          deadlinePressure: 1,
          estimatedMinutes: 180,
          id: "oversized-project",
          postponementCount: 4,
          preferredTimeMatch: 1,
          priorityWeight: 100
        },
        {
          deadlinePressure: 0.1,
          estimatedMinutes: 30,
          id: "journal",
          postponementCount: 0,
          preferredTimeMatch: 0.5,
          priorityWeight: 20
        }
      ],
      90
    );

    expect(options.map((option) => option.id)).toEqual(["exam-review", "exercise"]);
    expect(options.every((option) => option.estimatedMinutes <= 90)).toBe(true);
  });
});
