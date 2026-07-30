import { describe, expect, it } from "vitest";
import { evaluateSkipRequest, getEscalationPhase } from "@/system/tasks/escalationEngine";

describe("escalationEngine", () => {
  it("escalates postponed tasks into Phase 3 after repeated cycles", () => {
    expect(getEscalationPhase(0)).toBe("phase1");
    expect(getEscalationPhase(2)).toBe("phase2");
    expect(getEscalationPhase(4)).toBe("phase3");
  });

  it("blocks casual Phase 3 skipping but permits confirmed reasons or protected replacements", () => {
    expect(evaluateSkipRequest({ phase: "phase3" })).toEqual({
      allowed: false,
      reasonRequired: true,
      resolution: "blocked"
    });
    expect(evaluateSkipRequest({ phase: "phase3", reason: "Unexpected school requirement" }).allowed).toBe(true);
    expect(evaluateSkipRequest({ phase: "phase3", replacementType: "recovery" }).resolution).toBe(
      "protected_replacement"
    );
  });
});
