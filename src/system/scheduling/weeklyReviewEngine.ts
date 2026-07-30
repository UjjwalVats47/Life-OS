export type WeeklyReviewInput = {
  averageMood?: number;
  averageStress?: number;
  basePersonalTimeHours: number;
  completionRate: number;
  currentPersonalTimeHours: number;
  postponementRate: number;
  reviewType?: "midweek_calibration" | "weekend_identity_review";
  unfinishedImportantCount?: number;
};

export type WeeklyReviewResult = {
  adjustmentHours: number;
  carryoverPolicy: "protect_recovery" | "normal" | "deadline_first" | "structure_repair";
  mode: "growth_reward" | "stable" | "tighter_structure" | "recovery_protected";
  nextPersonalTimeHours: number;
  reason: string;
  reviewType: "midweek_calibration" | "weekend_identity_review";
};

export function calculateWeeklyPersonalTime(input: WeeklyReviewInput): WeeklyReviewResult {
  const completionRate = clamp(input.completionRate, 0, 1);
  const postponementRate = clamp(input.postponementRate, 0, 1);
  const highStress = (input.averageStress ?? 0) >= 7 || (input.averageMood ?? 10) <= 3;
  const reviewType = input.reviewType ?? "weekend_identity_review";
  const unfinishedImportantCount = input.unfinishedImportantCount ?? 0;
  let adjustmentHours = 0;
  let carryoverPolicy: WeeklyReviewResult["carryoverPolicy"] = "normal";
  let mode: WeeklyReviewResult["mode"] = "stable";
  let reason = "The week was mixed; personal time remains stable.";

  if (highStress) {
    mode = "recovery_protected";
    carryoverPolicy = "protect_recovery";
    adjustmentHours = Math.max(0, input.basePersonalTimeHours - input.currentPersonalTimeHours);
    reason = "Stress or low mood requires protected recovery without expanding unstructured avoidance.";
  } else if (completionRate >= 0.85 && postponementRate <= 0.1) {
    mode = "growth_reward";
    adjustmentHours = 1;
    carryoverPolicy = "protect_recovery";
    reason = "Strong completion and low postponement earned one additional hour.";
  } else if (unfinishedImportantCount >= 3 || completionRate < 0.6 || postponementRate > 0.3) {
    mode = "tighter_structure";
    carryoverPolicy = unfinishedImportantCount >= 3 ? "deadline_first" : "structure_repair";
    adjustmentHours = -1;
    reason = "Avoidance was high, so one unstructured hour is converted into planned time.";
  }

  if (reviewType === "midweek_calibration" && mode === "growth_reward") {
    adjustmentHours = 0;
    reason = "Midweek is for calibration, not reward. Keep the structure stable until weekend review.";
  }

  const nextPersonalTimeHours = clamp(input.currentPersonalTimeHours + adjustmentHours, 3, 10);

  return {
    adjustmentHours: nextPersonalTimeHours - input.currentPersonalTimeHours,
    carryoverPolicy,
    mode,
    nextPersonalTimeHours,
    reason,
    reviewType
  };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
