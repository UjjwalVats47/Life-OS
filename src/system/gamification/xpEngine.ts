export type XpTaskCategory = "small" | "negotiable" | "critical" | "deadline_prep" | "phase3";
export type TaskDifficulty = "easy" | "normal" | "hard" | "very_hard";
export type GoalLink =
  | "sys1_primary"
  | "sys1_secondary"
  | "sys1_tertiary"
  | "sys2_critical"
  | "sys2_negotiable"
  | "sys2_optional"
  | "unlinked";
export type CompletionTiming =
  | "early"
  | "on_time"
  | "late"
  | "repeated_postponement"
  | "phase3_negotiated";

export type XpCalculationInput = {
  category: XpTaskCategory;
  difficulty: TaskDifficulty;
  goalLink: GoalLink;
  streakDays?: number;
  timing: CompletionTiming;
  weakArea?: boolean;
  socialConfidence?: boolean;
};

export const baseXpByCategory: Record<XpTaskCategory, number> = {
  small: 10,
  negotiable: 25,
  critical: 45,
  deadline_prep: 55,
  phase3: 65
};

export const difficultyMultiplier: Record<TaskDifficulty, number> = {
  easy: 0.8,
  normal: 1,
  hard: 1.25,
  very_hard: 1.5
};

export const goalLinkMultiplier: Record<GoalLink, number> = {
  sys1_primary: 1.4,
  sys1_secondary: 1.2,
  sys1_tertiary: 1,
  sys2_critical: 1.15,
  sys2_negotiable: 1,
  sys2_optional: 0.85,
  unlinked: 0.6
};

export const timelinessMultiplier: Record<CompletionTiming, number> = {
  early: 1.1,
  on_time: 1,
  late: 0.7,
  repeated_postponement: 0.5,
  phase3_negotiated: 0.6
};

export function getBaseXp(category: XpTaskCategory) {
  return baseXpByCategory[category];
}

export function getStreakMultiplier(streakDays = 0) {
  if (streakDays >= 30) return 1.5;
  if (streakDays >= 14) return 1.3;
  if (streakDays >= 7) return 1.2;
  if (streakDays >= 3) return 1.1;

  return 1;
}

export function calculateXp(input: XpCalculationInput) {
  const weakAreaMultiplier = input.socialConfidence ? 1.2 : input.weakArea ? 1.15 : 1;

  return Math.max(
    0,
    Math.round(
      getBaseXp(input.category) *
        difficultyMultiplier[input.difficulty] *
        goalLinkMultiplier[input.goalLink] *
        timelinessMultiplier[input.timing] *
        getStreakMultiplier(input.streakDays) *
        weakAreaMultiplier
    )
  );
}
