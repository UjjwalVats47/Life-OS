export type EscalationPhase = "phase1" | "phase2" | "phase3";

export function getEscalationPhase(postponementCount: number): EscalationPhase {
  if (postponementCount >= 4) {
    return "phase3";
  }

  if (postponementCount >= 2) {
    return "phase2";
  }

  return "phase1";
}

export type SkipRequest = {
  phase: EscalationPhase;
  reason?: string;
  replacementType?: "ordinary" | "emergency" | "recovery";
};

export function evaluateSkipRequest(request: SkipRequest) {
  if (request.phase !== "phase3") {
    return {
      allowed: true,
      reasonRequired: false,
      resolution: "standard_skip" as const
    };
  }

  if (request.replacementType === "emergency" || request.replacementType === "recovery") {
    return {
      allowed: true,
      reasonRequired: false,
      resolution: "protected_replacement" as const
    };
  }

  if (request.reason?.trim()) {
    return {
      allowed: true,
      reasonRequired: true,
      resolution: "reason_confirmation" as const
    };
  }

  return {
    allowed: false,
    reasonRequired: true,
    resolution: "blocked" as const
  };
}
