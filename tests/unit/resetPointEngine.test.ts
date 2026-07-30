import { describe, expect, it } from "vitest";
import { calculateResetPoints } from "@/system/gamification/resetPointEngine";

describe("resetPointEngine", () => {
  it("derives reset points from XP performance ratio", () => {
    expect(calculateResetPoints(8, 40, 40)).toBe(8);
    expect(calculateResetPoints(8, 20, 40)).toBe(4);
  });
});
