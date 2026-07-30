import type { Habit, TaskAttempt, TaskTemplate } from "@/types/domain";

export type HabitStrength = {
  consistency: number;
  label: "fragile" | "forming" | "stable" | "identity_evidence";
  missedCount: number;
  momentum: "declining" | "flat" | "improving";
  pressure: "low" | "moderate" | "high";
  score: number;
};

export function calculateHabitStrength(input: {
  attempts: TaskAttempt[];
  habit: Habit;
  templates: TaskTemplate[];
  now?: Date;
}): HabitStrength {
  const templateIds = input.templates
    .filter((template) => template.habitId === input.habit.id)
    .map((template) => template.id);
  const related = input.attempts
    .filter((attempt) => templateIds.includes(attempt.taskTemplateId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const recent = getWithinDays(related, input.now ?? new Date(), 14);
  const olderHalf = recent.slice(0, Math.floor(recent.length / 2));
  const newerHalf = recent.slice(Math.floor(recent.length / 2));
  const completed = recent.filter((attempt) => attempt.status === "completed").length;
  const missedCount = recent.filter((attempt) =>
    attempt.status === "postponed" || attempt.status === "incomplete" || attempt.status === "skipped" || attempt.status === "failed"
  ).length;
  const consistency = recent.length ? Math.round((completed / recent.length) * 100) : 0;
  const olderRate = completionRate(olderHalf);
  const newerRate = completionRate(newerHalf);
  const momentum = newerRate > olderRate + 0.15 ? "improving" : newerRate < olderRate - 0.15 ? "declining" : "flat";
  const pressure = missedCount >= 4 ? "high" : missedCount >= 2 ? "moderate" : "low";
  const score = clamp(
    Math.round(consistency * 0.7 + (momentum === "improving" ? 15 : momentum === "declining" ? -10 : 5) - missedCount * 4),
    0,
    100
  );

  return {
    consistency,
    label: getLabel(score),
    missedCount,
    momentum,
    pressure,
    score
  };
}

function getWithinDays(attempts: TaskAttempt[], now: Date, days: number) {
  const threshold = now.getTime() - days * 24 * 60 * 60 * 1000;
  return attempts.filter((attempt) => new Date(attempt.createdAt).getTime() >= threshold);
}

function completionRate(attempts: TaskAttempt[]) {
  if (!attempts.length) return 0;
  return attempts.filter((attempt) => attempt.status === "completed").length / attempts.length;
}

function getLabel(score: number): HabitStrength["label"] {
  if (score >= 85) return "identity_evidence";
  if (score >= 65) return "stable";
  if (score >= 35) return "forming";
  return "fragile";
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
