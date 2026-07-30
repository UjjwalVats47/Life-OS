import { db } from "@/db/lifeOsDb";
import { defaultUserProfileId } from "@/db/repositories/profileRepo";
import { createId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import { calculateHabitStrength } from "@/system/habits/habitStrengthEngine";
import type { Habit, TargetHabit } from "@/types/domain";

export async function loadGoalsIdentity() {
  const userId = defaultUserProfileId;
  const profile = await db.userProfiles.get(userId);
  const identity = profile?.activeIdentityPathId
    ? await db.identityPaths.get(profile.activeIdentityPathId)
    : undefined;
  const goals = await db.goals.where("userId").equals(userId).toArray();
  const habits = await db.habits.where("userId").equals(userId).toArray();
  const resetPoints = (await db.resetPointLogs.where("userId").equals(userId).toArray()).reduce(
    (sum, log) => sum + log.amount,
    0
  );

  return {
    goals: goals.sort((a, b) => b.priorityWeight - a.priorityWeight),
    habits,
    identity,
    resetPoints
  };
}

export async function updateGoalProgress(goalId: string, progress: number) {
  await db.goals.update(goalId, {
    progress: Math.min(100, Math.max(0, Math.round(progress))),
    status: progress >= 100 ? "completed" : "active",
    updatedAt: nowIso()
  });
}

export async function loadHabitRedirection() {
  const userId = defaultUserProfileId;
  const [habits, targets, attempts] = await Promise.all([
    db.habits.where("userId").equals(userId).toArray(),
    db.targetHabits.where("userId").equals(userId).toArray(),
    db.taskAttempts.where("userId").equals(userId).toArray()
  ]);
  const templates = await db.taskTemplates.where("userId").equals(userId).toArray();

  return {
    habits: habits.map((habit) => {
      const strength = calculateHabitStrength({ attempts, habit, templates });
      return {
        consistency: strength.consistency,
        habit,
        strength
      };
    }),
    targets
  };
}

export async function createReplacementHabit(target: TargetHabit) {
  const timestamp = nowIso();
  const userId = defaultUserProfileId;
  const habit: Habit = {
    createdAt: timestamp,
    description: `Healthy replacement for ${target.title}`,
    difficulty: target.severity === "severe" || target.severity === "high" ? "normal" : "easy",
    domain: target.domain,
    frequency: "daily",
    id: createId(),
    status: "active",
    title: replacementTitle(target),
    updatedAt: timestamp,
    userId
  };

  await db.transaction("rw", [db.habits, db.targetHabits], async () => {
    await db.habits.put(habit);
    await db.targetHabits.update(target.id, {
      replacementHabitId: habit.id,
      status: "redirected",
      updatedAt: timestamp
    });
  });

  return habit;
}

function replacementTitle(target: TargetHabit) {
  const value = target.title.toLowerCase();
  if (value.includes("social")) return "Complete a two-minute social confidence rep";
  if (value.includes("sleep")) return "Begin shutdown routine on time";
  if (value.includes("spend")) return "Pause and log before discretionary spending";
  if (value.includes("procrast")) return "Start a five-minute proof action";
  return `Redirect: ${target.title}`;
}
