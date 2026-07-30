import { db } from "@/db/lifeOsDb";
import { defaultUserProfileId } from "@/db/repositories/profileRepo";
import { createId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import { createSundayPolicy } from "@/system/scheduling/sundayCatchup";
import { createRecoveryDirective } from "@/system/scheduling/recoveryEngine";
import { calculateWeeklyPersonalTime } from "@/system/scheduling/weeklyReviewEngine";

export async function loadDisciplineStatus() {
  const userId = defaultUserProfileId;
  const profile = await db.userProfiles.get(userId);
  const attempts = await getRecentAttempts(userId);
  const completed = attempts.filter((attempt) => attempt.status === "completed").length;
  const postponed = attempts.filter(
    (attempt) => attempt.status === "postponed" || attempt.status === "incomplete"
  ).length;
  const completionRate = attempts.length ? completed / attempts.length : 0;
  const postponementRate = attempts.length ? postponed / attempts.length : 0;
  const weekStartDate = currentWeekStartDate();
  const reviewsThisWeek = await getCurrentWeekReviews(userId, weekStartDate);
  const unfinishedImportant = await getUnfinishedImportantWorkItems(userId);
  const events = await db.events
    .where("userId")
    .equals(userId)
    .filter((event) => event.status !== "completed" && event.status !== "cancelled")
    .toArray();
  const sundayPolicy = createSundayPolicy(
    attempts
      .filter((attempt) => attempt.status !== "completed")
      .map((attempt) => ({
        deadlineRelated: false,
        estimatedMinutes: 45,
        id: attempt.id,
        unfinished: true,
        urgency: 0.5
      }))
      .concat(
        events.map((event) => ({
          deadlineRelated: true,
          estimatedMinutes: 45,
          id: event.id,
          unfinished: true,
          urgency: event.importance === "critical" ? 1 : event.importance === "high" ? 0.8 : 0.5
        }))
      ),
    completionRate
  );
  const recoveryDirective = createRecoveryDirective({
    completionRate,
    postponementRate,
    sundayMode: sundayPolicy.mode,
    unfinishedImportantCount: unfinishedImportant.length
  });

  return {
    completionRate,
    currentPersonalTimeHours: profile?.currentPersonalTimeHoursPerWeek ?? 7,
    nextReviewType:
      reviewsThisWeek.length === 0
        ? "midweek_calibration"
        : reviewsThisWeek.length === 1
          ? "weekend_identity_review"
          : "complete",
    postponementRate,
    recoveryDirective,
    reviewsCompleted: reviewsThisWeek.length,
    sundayPolicy,
    unfinishedImportantCount: unfinishedImportant.length
  };
}

export async function runWeeklyReview() {
  const userId = defaultUserProfileId;
  const weekStartDate = currentWeekStartDate();
  const existingReviews = await getCurrentWeekReviews(userId, weekStartDate);
  if (existingReviews.length >= 2) throw new Error("Both weekly reviews are already complete.");

  const profile = await db.userProfiles.get(userId);
  if (!profile) throw new Error("Complete The Awakening before running a weekly review.");

  const attempts = await getRecentAttempts(userId);
  const moods = await db.moodStressEntries
    .where("userId")
    .equals(userId)
    .filter((entry) => new Date(entry.createdAt).getTime() >= currentWeekStartTime())
    .toArray();
  const completed = attempts.filter((attempt) => attempt.status === "completed").length;
  const postponed = attempts.filter(
    (attempt) => attempt.status === "postponed" || attempt.status === "incomplete"
  ).length;
  const unfinishedImportant = await getUnfinishedImportantWorkItems(userId);
  const result = calculateWeeklyPersonalTime({
    averageMood: average(moods.map((entry) => entry.mood)),
    averageStress: average(moods.map((entry) => entry.stress)),
    basePersonalTimeHours: profile.basePersonalTimeHoursPerWeek,
    completionRate: attempts.length ? completed / attempts.length : 0,
    currentPersonalTimeHours: profile.currentPersonalTimeHoursPerWeek,
    postponementRate: attempts.length ? postponed / attempts.length : 0,
    reviewType: existingReviews.length === 0 ? "midweek_calibration" : "weekend_identity_review",
    unfinishedImportantCount: unfinishedImportant.length
  });
  const timestamp = nowIso();

  await db.transaction("rw", [db.appMeta, db.systemInsights, db.userProfiles], async () => {
    const reviewsThisWeek = await getCurrentWeekReviews(userId, weekStartDate);
    if (reviewsThisWeek.length >= 2) throw new Error("Both weekly reviews are already complete.");
    const reviewNumber = reviewsThisWeek.length + 1;

    await db.userProfiles.update(userId, {
      currentPersonalTimeHoursPerWeek: result.nextPersonalTimeHours,
      updatedAt: timestamp
    });
    await db.appMeta.put({
      createdAt: timestamp,
      id: currentWeekReviewId(reviewNumber),
      key: "weeklyReview",
      updatedAt: timestamp,
      value: {
        carryoverPolicy: result.carryoverPolicy,
        mode: result.mode,
        nextPersonalTimeHours: result.nextPersonalTimeHours,
        reviewNumber,
        reviewType: result.reviewType,
        unfinishedImportantCount: unfinishedImportant.length,
        userId,
        weekStartDate
      }
    });
    await db.systemInsights.put({
      body: result.reason,
      createdAt: timestamp,
      date: timestamp.slice(0, 10),
      id: createId(),
      insightType: "weekly_personal_time",
      severity: result.mode === "tighter_structure" ? "warning" : result.mode === "growth_reward" ? "positive" : "neutral",
      title: `${result.reviewType.split("_").join(" ")}: ${result.mode.split("_").join(" ")}`,
      updatedAt: timestamp,
      userId
    });
  });

  return result;
}

async function getRecentAttempts(userId: string) {
  return db.taskAttempts
    .where("userId")
    .equals(userId)
    .filter((attempt) => new Date(attempt.createdAt).getTime() >= currentWeekStartTime())
    .toArray();
}

async function getUnfinishedImportantWorkItems(userId: string) {
  return db.workItems
    .where("userId")
    .equals(userId)
    .filter(
      (item) =>
        (item.priority === "critical" || item.priority === "high" || item.kind === "deadline_prep") &&
        (item.status === "planned" || item.status === "postponed" || item.status === "skipped")
    )
    .toArray();
}

async function getCurrentWeekReviews(userId: string, weekStartDate: string) {
  return db.appMeta
    .where("key")
    .equals("weeklyReview")
    .filter((meta) => {
      const value = meta.value;
      if (!value || typeof value !== "object") return false;

      return (
        "userId" in value &&
        "weekStartDate" in value &&
        value.userId === userId &&
        value.weekStartDate === weekStartDate
      );
    })
    .toArray();
}

function currentWeekReviewId(reviewNumber: number) {
  return `weekly-review-${defaultUserProfileId}-${currentWeekStartDate()}-${reviewNumber}`;
}

function currentWeekStartTime() {
  return startOfLocalWeek().getTime();
}

function currentWeekStartDate() {
  const weekStart = startOfLocalWeek();
  const year = weekStart.getFullYear();
  const month = `${weekStart.getMonth() + 1}`.padStart(2, "0");
  const day = `${weekStart.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function startOfLocalWeek() {
  const date = new Date();
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysSinceMonday);

  return date;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : undefined;
}
