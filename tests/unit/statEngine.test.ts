import { describe, expect, it } from "vitest";
import { calculateStatAwards, calculateStatPoints } from "@/system/gamification/statEngine";

describe("statEngine", () => {
  it("calculates points without the XP streak multiplier", () => {
    expect(calculateStatPoints("critical", "hard", "on_time")).toBe(5);
    expect(calculateStatPoints("critical", "normal", "late")).toBe(3);
  });

  it("splits multiple stats without creating or losing points", () => {
    expect(
      calculateStatAwards("critical", "hard", "on_time", {
        intelligence: 60,
        focus: 40
      })
    ).toEqual({ intelligence: 3, focus: 2 });
  });
});
