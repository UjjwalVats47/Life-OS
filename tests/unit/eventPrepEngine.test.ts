import { describe, expect, it } from "vitest";
import { generateEventPrepPlan } from "@/system/events/eventPrepEngine";

describe("eventPrepEngine", () => {
  it("creates dated preparation checkpoints without scheduling in the past", () => {
    const plan = generateEventPrepPlan(
      {
        eventDate: "2026-08-20",
        eventType: "exam_test",
        importance: "critical",
        title: "Physics exam"
      },
      "2026-08-01"
    );

    expect(plan.map((step) => step.scheduledDate)).toEqual([
      "2026-08-06",
      "2026-08-13",
      "2026-08-18",
      "2026-08-20"
    ]);
  });
});
