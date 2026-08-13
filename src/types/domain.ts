import type { AiMode, LifeDomain, Rank, StatName, SystemTone } from "@/types/enums";

export type BaseRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = BaseRecord & {
  activeIdentityPathId?: string;
  basePersonalTimeHoursPerWeek: number;
  currentPersonalTimeHoursPerWeek: number;
  displayName: string;
  onboardingCompleted: boolean;
};

export type PersonalityProfile = BaseRecord & {
  agreeableness?: number;
  conscientiousness?: number;
  extraversion?: number;
  mbtiType?: string;
  neuroticism?: number;
  notes?: string;
  openness?: number;
  userId: string;
};

export type IdentityPath = BaseRecord & {
  attacks: string[];
  desiredDirectionInput?: string;
  intensity: "low" | "medium" | "high" | "extreme";
  name: string;
  pillars: LifeDomain[];
  rewards: string[];
  status: "suggested" | "refined" | "active" | "archived";
  systemReason: string;
  transformationPromise: string;
  userId: string;
};

export type Goal = BaseRecord & {
  availableResources?: string;
  constraints?: string;
  currentLevel?: string;
  deadlineAt?: string;
  description?: string;
  domain: LifeDomain;
  importance: "critical" | "negotiable" | "optional" | "none";
  level: "primary" | "secondary" | "tertiary" | "none";
  parentGoalId?: string;
  priorityWeight: number;
  progress: number;
  reason: string;
  status: "active" | "paused" | "completed" | "failed" | "archived";
  system: "sys1" | "sys2";
  targetOutcome?: string;
  timelineMonths?: number;
  title: string;
  userId: string;
};

export type GoalCapability = {
  evidence: string;
  key: string;
  label: string;
  priority: "critical" | "high" | "normal";
  purpose: string;
};

export type GoalActionPlan = BaseRecord & {
  archetype:
    | "coding"
    | "academic_exam"
    | "career"
    | "fitness"
    | "social_confidence"
    | "finance"
    | "discipline"
    | "generic_skill";
  assumptions: string[];
  capabilities: GoalCapability[];
  goalId: string;
  interpretation: string;
  status: "active" | "outdated" | "archived";
  successSignals: string[];
  userId: string;
  version: number;
};

export type GoalActionFeedbackReason =
  | "too_long"
  | "too_difficult"
  | "too_easy"
  | "resource_unavailable"
  | "unclear"
  | "not_relevant"
  | "other";

export type GoalActionFeedback = BaseRecord & {
  actionType?: TaskTemplate["actionType"];
  feedbackType: "rejected" | "edited";
  goalId: string;
  goalPlanId: string;
  originalCompletionEvidence: string;
  originalEstimatedMinutes: number;
  originalInstructions: string[];
  originalTitle: string;
  reasonCode?: GoalActionFeedbackReason;
  reasonText?: string;
  revisedCompletionEvidence?: string;
  revisedEstimatedMinutes?: number;
  revisedInstructions?: string[];
  revisedTitle?: string;
  taskKey: string;
  taskTemplateId: string;
  userId: string;
};

export type ScheduleBlock = BaseRecord & {
  blockType: "school" | "work" | "sleep" | "meal" | "commute" | "coaching" | "other";
  dayOfWeek: number;
  endTime: string;
  startTime: string;
  title: string;
  userId: string;
};

export type Commitment = BaseRecord & {
  commitmentType: "fixed" | "flexible";
  dayOfWeek: number;
  domain?: LifeDomain;
  endTime: string;
  goalId?: string;
  startTime: string;
  title: string;
  userId: string;
};

export type FreeBlock = BaseRecord & {
  dayOfWeek: number;
  endTime: string;
  sourceHash: string;
  startTime: string;
  userId: string;
};

export type Habit = BaseRecord & {
  description?: string;
  difficulty: "easy" | "normal" | "hard" | "very_hard";
  domain: LifeDomain;
  frequency: string;
  goalId?: string;
  preferredTimeOfDay?: string;
  status: "active" | "paused" | "completed" | "archived";
  title: string;
  userId: string;
};

export type TargetHabit = BaseRecord & {
  description?: string;
  domain: LifeDomain;
  replacementHabitId?: string;
  severity: "low" | "moderate" | "high" | "severe";
  status: "active" | "reducing" | "redirected" | "archived";
  title: string;
  userId: string;
};

export type TaskTemplate = BaseRecord & {
  actionType?:
    | "resource_setup"
    | "baseline_assessment"
    | "guided_practice"
    | "timed_practice"
    | "review_mistakes"
    | "project_output"
    | "supporting_skill"
    | "real_world_exposure"
    | "routine";
  baseXp: number;
  capabilityKey?: string;
  category: "small" | "negotiable" | "critical" | "deadline_prep" | "phase3";
  completionEvidence?: string;
  dependencyTaskKeys?: string[];
  description?: string;
  difficulty: "easy" | "normal" | "hard" | "very_hard";
  domain: LifeDomain;
  estimatedMinutes: number;
  eventId?: string;
  generationSource?: "deterministic" | "local_ai" | "external_ai" | "user_edit" | "user_feedback";
  goalId?: string;
  goalPlanId?: string;
  habitId?: string;
  instructions?: string[];
  resourceQuery?: string;
  sequenceIndex?: number;
  specificityScore?: number;
  statWeights: Partial<Record<StatName, number>>;
  status: "active" | "paused" | "archived";
  taskKey?: string;
  title: string;
  userId: string;
};

export type QuestSlot = BaseRecord & {
  date: string;
  dayOfWeek: number;
  endTime: string;
  phase: "phase1" | "phase2" | "phase3";
  sourceFreeBlockId?: string;
  startTime: string;
  status: "pending" | "active" | "completed" | "skipped" | "expired";
  userId: string;
};

export type QuestSlotOption = BaseRecord & {
  questSlotId: string;
  rank: 1 | 2;
  score: number;
  status: "offered" | "selected" | "rejected" | "expired";
  systemReason: string;
  taskTemplateId: string;
  userId: string;
};

export type TaskAttempt = BaseRecord & {
  actualMinutes?: number;
  completionTiming?: "early" | "on_time" | "late" | "repeated_postponement" | "phase3_negotiated";
  completionProof?: string;
  difficultyFeedback?: "too_easy" | "right" | "too_hard";
  finishedAt?: string;
  incompleteReason?: string;
  questSlotId: string;
  resultScore?: number;
  resultSummary?: string;
  skipReason?: string;
  startedAt?: string;
  status: "started" | "completed" | "incomplete" | "skipped" | "postponed" | "failed";
  taskTemplateId: string;
  userId: string;
};

export type WorkItemKind =
  | "fixed_block"
  | "fixed_commitment"
  | "flexible_commitment"
  | "routine"
  | "recovery"
  | "deadline_prep"
  | "quest";

export type WorkItemFlexibility = "locked" | "bounded" | "free";

export type WorkItemSourceType =
  | "schedule_block"
  | "commitment"
  | "habit"
  | "task_template"
  | "quest_slot"
  | "event_prep"
  | "manual";

export type WorkItemStatus =
  | "planned"
  | "offered"
  | "started"
  | "completed"
  | "skipped"
  | "postponed"
  | "expired";

export type WorkItem = BaseRecord & {
  actualMinutes?: number;
  date?: string;
  dayOfWeek?: number;
  domain?: LifeDomain;
  endTime?: string;
  eventId?: string;
  flexibility: WorkItemFlexibility;
  goalId?: string;
  habitId?: string;
  kind: WorkItemKind;
  maximumMinutes?: number;
  minimumMinutes?: number;
  plannedMinutes: number;
  preferredMinutes: number;
  priority: "critical" | "high" | "normal" | "low";
  resetEligible: boolean;
  resetPointValue: number;
  sourceId?: string;
  sourceType: WorkItemSourceType;
  startTime?: string;
  statWeights: Partial<Record<StatName, number>>;
  status: WorkItemStatus;
  title: string;
  userId: string;
};

export type XpLog = {
  id: string;
  amount: number;
  createdAt: string;
  formulaSnapshot?: string;
  goalId?: string;
  habitId?: string;
  reason: string;
  taskAttemptId?: string;
  userId: string;
};

export type StatLog = {
  id: string;
  amount: number;
  createdAt: string;
  stat: StatName;
  taskAttemptId?: string;
  userId: string;
};

export type RankSnapshot = {
  id: string;
  activeRank: Rank;
  capturedAt: string;
  createdAt: string;
  lifetimeXp: number;
  recentBehaviorScore: number;
  unlockedRank: Rank;
  userId: string;
};

export type Streak = BaseRecord & {
  currentCount: number;
  lastSuccessDate?: string;
  longestCount: number;
  streakType: "daily" | "weekly" | "habit" | "goal";
  targetId?: string;
  userId: string;
};

export type ResetPointLog = {
  id: string;
  amount: number;
  createdAt: string;
  goalId?: string;
  performanceRatio: number;
  reason: string;
  taskAttemptId?: string;
  userId: string;
};

export type OverrideAttempt = BaseRecord & {
  goalId: string;
  reasonText: string;
  resetPointsCost?: number;
  severity: "low" | "moderate" | "severe";
  status: "approved_free" | "approved_penalized" | "rejected" | "withdrawn";
  systemResponse?: string;
  userId: string;
  xpPenalty?: number;
};

export type MoodStressEntry = BaseRecord & {
  date: string;
  mood: number;
  stress: number;
  timeOfDay?: string;
  triggerType?: string;
  userId: string;
};

export type ReflectionNote = BaseRecord & {
  body: string;
  date: string;
  moodStressEntryId?: string;
  userId: string;
};

export type FinanceEntry = BaseRecord & {
  amount: number;
  category: string;
  currency: string;
  date: string;
  domain?: LifeDomain;
  goalId?: string;
  moodStressEntryId?: string;
  note?: string;
  userId: string;
};

export type LifeEvent = BaseRecord & {
  details?: string;
  eventDate: string;
  eventType:
    | "exam_test"
    | "submission"
    | "interview"
    | "bill_due"
    | "birthday_anniversary"
    | "user_defined";
  importance: "low" | "medium" | "high" | "critical";
  status: "planned" | "active" | "completed" | "cancelled";
  title: string;
  userId: string;
};

export type EventPrepItem = BaseRecord & {
  eventId: string;
  scheduledDate: string;
  status: "draft" | "approved" | "scheduled" | "completed" | "skipped";
  taskTemplateId?: string;
  userId: string;
};

export type Notification = BaseRecord & {
  body: string;
  linkedId?: string;
  linkedType?: string;
  notificationType:
    | "task_start"
    | "deadline"
    | "phase3_warning"
    | "end_of_day_reflection"
    | "mood_stress_checkin"
    | "weekly_review";
  scheduledAt: string;
  status: "scheduled" | "shown" | "dismissed" | "completed";
  title: string;
  userId: string;
};

export type SystemInsight = BaseRecord & {
  body: string;
  date: string;
  insightType: string;
  severity: "positive" | "neutral" | "warning" | "critical";
  sourceRefs?: string[];
  title: string;
  userId: string;
};

export type AppMeta = BaseRecord & {
  key: string;
  value: unknown;
};

export type AiInteraction = {
  id: string;
  contextType: string;
  createdAt: string;
  inputSummary?: string;
  mode: AiMode;
  outputText: string;
  tone: SystemTone;
  userId: string;
};
