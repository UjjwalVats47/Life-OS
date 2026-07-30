import { describe, expect, it } from "vitest";
import { getActiveRank, getUnlockedRank } from "@/system/gamification/rankEngine";

describe("rankEngine", () => {
  it("moves beginner ranks quickly and keeps higher ranks serious", () => {
    expect(getUnlockedRank(0)).toBe("E");
    expect(getUnlockedRank(300)).toBe("D");
    expect(getUnlockedRank(900)).toBe("C");
    expect(getUnlockedRank(45_000)).toBe("Monarch");
  });

  it("keeps unlocked progress while active rank reflects recent behavior", () => {
    expect(getActiveRank("A", 90)).toEqual({ activeRank: "A", unstable: false });
    expect(getActiveRank("A", 72)).toEqual({ activeRank: "A", unstable: true });
    expect(getActiveRank("A", 58)).toEqual({ activeRank: "B", unstable: false });
    expect(getActiveRank("A", 40)).toEqual({ activeRank: "C", unstable: false });
  });
});
