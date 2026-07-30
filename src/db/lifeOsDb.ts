import Dexie, { type Table } from "dexie";
import type {
  AiInteraction,
  AppMeta,
  Commitment,
  EventPrepItem,
  FinanceEntry,
  FreeBlock,
  Goal,
  Habit,
  IdentityPath,
  LifeEvent,
  MoodStressEntry,
  Notification,
  OverrideAttempt,
  PersonalityProfile,
  QuestSlot,
  QuestSlotOption,
  RankSnapshot,
  ReflectionNote,
  ResetPointLog,
  ScheduleBlock,
  StatLog,
  Streak,
  SystemInsight,
  TargetHabit,
  TaskAttempt,
  TaskTemplate,
  UserProfile,
  WorkItem,
  XpLog
} from "@/types/domain";

export class LifeOsDb extends Dexie {
  aiInteractions!: Table<AiInteraction, string>;
  appMeta!: Table<AppMeta, string>;
  commitments!: Table<Commitment, string>;
  eventPrepItems!: Table<EventPrepItem, string>;
  events!: Table<LifeEvent, string>;
  financeEntries!: Table<FinanceEntry, string>;
  freeBlocks!: Table<FreeBlock, string>;
  goals!: Table<Goal, string>;
  habits!: Table<Habit, string>;
  identityPaths!: Table<IdentityPath, string>;
  moodStressEntries!: Table<MoodStressEntry, string>;
  notifications!: Table<Notification, string>;
  overrideAttempts!: Table<OverrideAttempt, string>;
  personalityProfiles!: Table<PersonalityProfile, string>;
  questSlotOptions!: Table<QuestSlotOption, string>;
  questSlots!: Table<QuestSlot, string>;
  rankSnapshots!: Table<RankSnapshot, string>;
  reflectionNotes!: Table<ReflectionNote, string>;
  resetPointLogs!: Table<ResetPointLog, string>;
  scheduleBlocks!: Table<ScheduleBlock, string>;
  statLogs!: Table<StatLog, string>;
  streaks!: Table<Streak, string>;
  systemInsights!: Table<SystemInsight, string>;
  targetHabits!: Table<TargetHabit, string>;
  taskAttempts!: Table<TaskAttempt, string>;
  taskTemplates!: Table<TaskTemplate, string>;
  userProfiles!: Table<UserProfile, string>;
  workItems!: Table<WorkItem, string>;
  xpLogs!: Table<XpLog, string>;

  constructor() {
    super("LifeOsLocalDb");

    this.version(1).stores({
      aiInteractions: "id, userId, mode, tone, contextType, createdAt",
      appMeta: "id, key, updatedAt",
      commitments: "id, userId, dayOfWeek, startTime, endTime, commitmentType, domain, goalId, createdAt, updatedAt",
      eventPrepItems: "id, userId, eventId, taskTemplateId, status, scheduledDate, createdAt, updatedAt",
      events: "id, userId, eventType, eventDate, importance, status, createdAt, updatedAt",
      financeEntries: "id, userId, date, category, domain, goalId, moodStressEntryId, createdAt, updatedAt",
      freeBlocks: "id, userId, dayOfWeek, startTime, endTime, sourceHash, createdAt, updatedAt",
      goals: "id, userId, system, level, importance, domain, status, deadlineAt, parentGoalId, createdAt, updatedAt",
      habits: "id, userId, goalId, domain, status, frequency, createdAt, updatedAt",
      identityPaths: "id, userId, status, intensity, createdAt, updatedAt",
      moodStressEntries: "id, userId, mood, stress, date, timeOfDay, createdAt, updatedAt",
      notifications: "id, userId, notificationType, scheduledAt, status, linkedType, linkedId, createdAt, updatedAt",
      overrideAttempts: "id, userId, goalId, status, severity, createdAt, updatedAt",
      personalityProfiles: "id, userId, mbtiType, openness, conscientiousness, extraversion, agreeableness, neuroticism, createdAt, updatedAt",
      questSlotOptions: "id, userId, questSlotId, taskTemplateId, rank, status, createdAt, updatedAt",
      questSlots: "id, userId, date, dayOfWeek, startTime, endTime, phase, status, createdAt, updatedAt",
      rankSnapshots: "id, userId, activeRank, unlockedRank, capturedAt, createdAt",
      reflectionNotes: "id, userId, moodStressEntryId, date, createdAt, updatedAt",
      resetPointLogs: "id, userId, taskAttemptId, goalId, reason, createdAt",
      scheduleBlocks: "id, userId, dayOfWeek, startTime, endTime, blockType, createdAt, updatedAt",
      statLogs: "id, userId, taskAttemptId, stat, createdAt",
      streaks: "id, userId, streakType, targetId, currentCount, longestCount, lastSuccessDate, updatedAt",
      systemInsights: "id, userId, insightType, severity, date, createdAt, updatedAt",
      targetHabits: "id, userId, domain, status, severity, createdAt, updatedAt",
      taskAttempts: "id, userId, questSlotId, taskTemplateId, status, startedAt, finishedAt, createdAt, updatedAt",
      taskTemplates: "id, userId, goalId, habitId, eventId, domain, category, status, createdAt, updatedAt",
      userProfiles: "id, onboardingCompleted, activeIdentityPathId, createdAt, updatedAt",
      xpLogs: "id, userId, taskAttemptId, goalId, habitId, reason, createdAt"
    });

    this.version(2).stores({
      workItems: "id, userId, sourceType, sourceId, kind, status, date, dayOfWeek, startTime, endTime, goalId, habitId, eventId, priority, flexibility, createdAt, updatedAt"
    });
  }
}

export const db = new LifeOsDb();
