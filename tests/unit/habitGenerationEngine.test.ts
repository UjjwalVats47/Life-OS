import { describe, expect, it } from "vitest";
import { generateStarterHabits } from "@/system/habits/habitGenerationEngine";

describe("habitGenerationEngine", () => {
  it("generates one evidence-based starter habit per priority domain", () => {
    const habits = generateStarterHabits([
      "discipline_routine",
      "skills_career",
      "personality_social_confidence",
      "skills_career"
    ]);

    expect(habits).toHaveLength(3);
    expect(habits.map((habit) => habit.domain)).toEqual([
      "discipline_routine",
      "skills_career",
      "personality_social_confidence"
    ]);
  });
});
