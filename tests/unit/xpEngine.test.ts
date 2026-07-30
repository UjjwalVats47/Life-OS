import { describe, expect, it } from "vitest";
import { calculateXp, getBaseXp, getStreakMultiplier } from "@/system/gamification/xpEngine";

describe("xpEngine", () => {
  it("uses the v1 base XP defaults", () => {
    expect(getBaseXp("small")).toBe(10);
    expect(getBaseXp("negotiable")).toBe(25);
    expect(getBaseXp("critical")).toBe(45);
    expect(getBaseXp("deadline_prep")).toBe(55);
    expect(getBaseXp("phase3")).toBe(65);
  });

  it("applies the approved multipliers in one explainable calculation", () => {
    expect(
      calculateXp({
        category: "critical",
        difficulty: "hard",
        goalLink: "sys1_primary",
        streakDays: 7,
        timing: "early",
        weakArea: true
      })
    ).toBe(120);
  });

  it("still awards reduced XP for late completion", () => {
    expect(
      calculateXp({
        category: "negotiable",
        difficulty: "normal",
        goalLink: "sys1_tertiary",
        timing: "late"
      })
    ).toBe(18);
  });

  it("uses the highest reached streak tier", () => {
    expect(getStreakMultiplier(2)).toBe(1);
    expect(getStreakMultiplier(14)).toBe(1.3);
    expect(getStreakMultiplier(45)).toBe(1.5);
  });
});
