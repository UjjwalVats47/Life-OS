import type { SundayMode } from "@/system/scheduling/sundayCatchup";

export type RecoveryDirective = {
  intensity: "protected_rest" | "normal" | "structure_repair" | "deadline_first";
  message: string;
  recoveryMinutes: number;
};

export function createRecoveryDirective(input: {
  completionRate: number;
  postponementRate: number;
  sundayMode: SundayMode;
  unfinishedImportantCount: number;
}): RecoveryDirective {
  if (input.sundayMode === "deadline_priority" || input.unfinishedImportantCount >= 3) {
    return {
      intensity: "deadline_first",
      message: "Deadline-linked work comes first; protect evening recovery after the critical carryover is handled.",
      recoveryMinutes: 90
    };
  }

  if (input.completionRate < 0.6 || input.postponementRate > 0.3) {
    return {
      intensity: "structure_repair",
      message: "Use lighter recovery, then rebuild structure with smaller bounded commitments.",
      recoveryMinutes: 60
    };
  }

  if (input.completionRate >= 0.8 && input.postponementRate <= 0.1) {
    return {
      intensity: "protected_rest",
      message: "Week quality is strong; recovery is protected instead of being filled with extra tasks.",
      recoveryMinutes: 150
    };
  }

  return {
    intensity: "normal",
    message: "Keep recovery present, but do not let it become avoidance.",
    recoveryMinutes: 90
  };
}
