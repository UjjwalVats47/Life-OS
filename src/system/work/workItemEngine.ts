import { db } from "@/db/lifeOsDb";
import { defaultUserProfileId } from "@/db/repositories/profileRepo";
import { nowIso } from "@/lib/dates";
import type {
  Commitment,
  EventPrepItem,
  Goal,
  Habit,
  LifeEvent,
  QuestSlot,
  ScheduleBlock,
  TaskAttempt,
  TaskTemplate,
  WorkItem,
  WorkItemKind,
  WorkItemStatus
} from "@/types/domain";
import type { LifeDomain, StatName } from "@/types/enums";

export type WorkItemProjectionInput = {
  commitments: Commitment[];
  eventPrepItems: EventPrepItem[];
  events: LifeEvent[];
  goals: Goal[];
  habits: Habit[];
  questSlots: QuestSlot[];
  scheduleBlocks: ScheduleBlock[];
  taskAttempts: TaskAttempt[];
  taskTemplates: TaskTemplate[];
  timestamp: string;
  userId: string;
};

export async function loadUnifiedWorkItems(userId = defaultUserProfileId) {
  const stored = await db.workItems.where("userId").equals(userId).toArray();
  if (stored.length) return stored.sort(compareWorkItems);

  return projectWorkItemsFromRecords({
    commitments: await db.commitments.where("userId").equals(userId).toArray(),
    eventPrepItems: await db.eventPrepItems.where("userId").equals(userId).toArray(),
    events: await db.events.where("userId").equals(userId).toArray(),
    goals: await db.goals.where("userId").equals(userId).toArray(),
    habits: await db.habits.where("userId").equals(userId).toArray(),
    questSlots: await db.questSlots.where("userId").equals(userId).toArray(),
    scheduleBlocks: await db.scheduleBlocks.where("userId").equals(userId).toArray(),
    taskAttempts: await db.taskAttempts.where("userId").equals(userId).toArray(),
    taskTemplates: await db.taskTemplates.where("userId").equals(userId).toArray(),
    timestamp: nowIso(),
    userId
  }).sort(compareWorkItems);
}

export async function syncWorkItemsFromExistingData(userId = defaultUserProfileId) {
  const timestamp = nowIso();
  const workItems = projectWorkItemsFromRecords({
    commitments: await db.commitments.where("userId").equals(userId).toArray(),
    eventPrepItems: await db.eventPrepItems.where("userId").equals(userId).toArray(),
    events: await db.events.where("userId").equals(userId).toArray(),
    goals: await db.goals.where("userId").equals(userId).toArray(),
    habits: await db.habits.where("userId").equals(userId).toArray(),
    questSlots: await db.questSlots.where("userId").equals(userId).toArray(),
    scheduleBlocks: await db.scheduleBlocks.where("userId").equals(userId).toArray(),
    taskAttempts: await db.taskAttempts.where("userId").equals(userId).toArray(),
    taskTemplates: await db.taskTemplates.where("userId").equals(userId).toArray(),
    timestamp,
    userId
  });

  await db.transaction("rw", db.workItems, async () => {
    await db.workItems.where("userId").equals(userId).delete();
    if (workItems.length) await db.workItems.bulkPut(workItems);
  });

  return workItems;
}

export function projectWorkItemsFromRecords(input: WorkItemProjectionInput): WorkItem[] {
  const items: WorkItem[] = [];
  const goalById = new Map(input.goals.map((goal) => [goal.id, goal]));
  const habitById = new Map(input.habits.map((habit) => [habit.id, habit]));
  const templateById = new Map(input.taskTemplates.map((template) => [template.id, template]));
  const eventById = new Map(input.events.map((event) => [event.id, event]));
  const activeAttemptBySlotId = new Map(
    input.taskAttempts
      .filter((attempt) => attempt.status === "started" || attempt.status === "completed" || attempt.status === "postponed")
      .map((attempt) => [attempt.questSlotId, attempt])
  );

  for (const block of input.scheduleBlocks) {
    items.push({
      createdAt: input.timestamp,
      dayOfWeek: block.dayOfWeek,
      endTime: block.endTime,
      flexibility: "locked",
      id: sourceWorkItemId("schedule_block", block.id),
      kind: "fixed_block",
      plannedMinutes: minutesBetween(block.startTime, block.endTime),
      preferredMinutes: minutesBetween(block.startTime, block.endTime),
      priority: block.blockType === "sleep" ? "critical" : "high",
      resetEligible: false,
      resetPointValue: 0,
      sourceId: block.id,
      sourceType: "schedule_block",
      startTime: block.startTime,
      statWeights: block.blockType === "sleep" ? { vitality: 70, perception: 30 } : { discipline: 100 },
      status: "planned",
      title: block.title,
      updatedAt: input.timestamp,
      userId: input.userId
    });
  }

  for (const commitment of input.commitments) {
    const goal = commitment.goalId ? goalById.get(commitment.goalId) : undefined;
    const kind: WorkItemKind = commitment.commitmentType === "fixed" ? "fixed_commitment" : "flexible_commitment";
    const duration = minutesBetween(commitment.startTime, commitment.endTime);

    items.push({
      createdAt: input.timestamp,
      dayOfWeek: commitment.dayOfWeek,
      domain: commitment.domain,
      endTime: commitment.endTime,
      flexibility: commitment.commitmentType === "fixed" ? "locked" : "bounded",
      goalId: commitment.goalId,
      id: sourceWorkItemId("commitment", commitment.id),
      kind,
      maximumMinutes: commitment.commitmentType === "fixed" ? duration : Math.round(duration * 1.2),
      minimumMinutes: commitment.commitmentType === "fixed" ? duration : Math.max(10, Math.round(duration * 0.8)),
      plannedMinutes: duration,
      preferredMinutes: duration,
      priority: goalPriority(goal),
      resetEligible: Boolean(goal),
      resetPointValue: goalResetPoints(goal),
      sourceId: commitment.id,
      sourceType: "commitment",
      startTime: commitment.startTime,
      statWeights: statWeightsForDomain(commitment.domain),
      status: "planned",
      title: commitment.title,
      updatedAt: input.timestamp,
      userId: input.userId
    });
  }

  for (const habit of input.habits) {
    items.push({
      createdAt: input.timestamp,
      domain: habit.domain,
      flexibility: "bounded",
      goalId: habit.goalId,
      habitId: habit.id,
      id: sourceWorkItemId("habit", habit.id),
      kind: habit.domain === "fitness_health" ? "routine" : "quest",
      maximumMinutes: habit.difficulty === "easy" ? 20 : 45,
      minimumMinutes: habit.difficulty === "easy" ? 5 : 15,
      plannedMinutes: habit.difficulty === "easy" ? 15 : 30,
      preferredMinutes: habit.difficulty === "easy" ? 15 : 30,
      priority: habit.goalId ? "high" : "normal",
      resetEligible: true,
      resetPointValue: 3,
      sourceId: habit.id,
      sourceType: "habit",
      statWeights: statWeightsForDomain(habit.domain),
      status: "planned",
      title: habit.title,
      updatedAt: input.timestamp,
      userId: input.userId
    });
  }

  for (const template of input.taskTemplates) {
    const goal = template.goalId ? goalById.get(template.goalId) : undefined;
    const habit = template.habitId ? habitById.get(template.habitId) : undefined;

    items.push({
      createdAt: input.timestamp,
      domain: template.domain,
      eventId: template.eventId,
      flexibility: "bounded",
      goalId: template.goalId,
      habitId: template.habitId,
      id: sourceWorkItemId("task_template", template.id),
      kind: template.category === "deadline_prep" ? "deadline_prep" : habit ? "routine" : "quest",
      maximumMinutes: Math.max(template.estimatedMinutes, Math.round(template.estimatedMinutes * 1.25)),
      minimumMinutes: Math.max(10, Math.round(template.estimatedMinutes * 0.75)),
      plannedMinutes: template.estimatedMinutes,
      preferredMinutes: template.estimatedMinutes,
      priority: goalPriority(goal, template.category === "critical"),
      resetEligible: Boolean(goal || habit),
      resetPointValue: goalResetPoints(goal, Boolean(habit)),
      sourceId: template.id,
      sourceType: "task_template",
      statWeights: template.statWeights,
      status: template.status === "active" ? "planned" : "expired",
      title: template.title,
      updatedAt: input.timestamp,
      userId: input.userId
    });
  }

  for (const slot of input.questSlots) {
    const attempt = activeAttemptBySlotId.get(slot.id);
    const status = attempt ? attemptStatusToWorkStatus(attempt.status) : slotStatusToWorkStatus(slot.status);

    items.push({
      createdAt: input.timestamp,
      date: slot.date,
      dayOfWeek: slot.dayOfWeek,
      endTime: slot.endTime,
      flexibility: slot.phase === "phase3" ? "locked" : "bounded",
      id: sourceWorkItemId("quest_slot", slot.id),
      kind: "quest",
      plannedMinutes: minutesBetween(slot.startTime, slot.endTime),
      preferredMinutes: minutesBetween(slot.startTime, slot.endTime),
      priority: slot.phase === "phase3" ? "critical" : "normal",
      resetEligible: true,
      resetPointValue: slot.phase === "phase3" ? 5 : 2,
      sourceId: slot.id,
      sourceType: "quest_slot",
      startTime: slot.startTime,
      statWeights: {},
      status,
      title: slot.phase === "phase3" ? "Phase 3 quest slot" : "Quest slot",
      updatedAt: input.timestamp,
      userId: input.userId
    });
  }

  for (const prep of input.eventPrepItems) {
    const event = eventById.get(prep.eventId);
    items.push({
      createdAt: input.timestamp,
      date: prep.scheduledDate,
      eventId: prep.eventId,
      flexibility: "bounded",
      id: sourceWorkItemId("event_prep", prep.id),
      kind: "deadline_prep",
      maximumMinutes: 60,
      minimumMinutes: 20,
      plannedMinutes: 45,
      preferredMinutes: 45,
      priority: event?.importance === "critical" ? "critical" : event?.importance === "high" ? "high" : "normal",
      resetEligible: true,
      resetPointValue: event?.importance === "critical" ? 6 : 3,
      sourceId: prep.id,
      sourceType: "event_prep",
      statWeights: { discipline: 40, focus: 60 },
      status: prep.status === "completed" ? "completed" : prep.status === "skipped" ? "skipped" : "planned",
      title: event ? `Prep: ${event.title}` : "Event preparation",
      updatedAt: input.timestamp,
      userId: input.userId
    });
  }

  return dedupeById(items);
}

export function compareWorkItems(a: WorkItem, b: WorkItem) {
  const dateComparison = (a.date ?? "").localeCompare(b.date ?? "");
  if (dateComparison !== 0) return dateComparison;
  const dayComparison = (a.dayOfWeek ?? 99) - (b.dayOfWeek ?? 99);
  if (dayComparison !== 0) return dayComparison;
  return (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99");
}

function sourceWorkItemId(sourceType: WorkItem["sourceType"], sourceId: string) {
  return `work-${sourceType}-${sourceId}`;
}

function minutesBetween(startTime: string, endTime: string) {
  return Math.max(0, toMinutes(endTime) - toMinutes(startTime));
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function goalPriority(goal?: Goal, forceCritical = false): WorkItem["priority"] {
  if (forceCritical || goal?.importance === "critical" || goal?.level === "primary") return "critical";
  if (goal?.importance === "negotiable" || goal?.level === "secondary") return "high";
  if (goal) return "normal";
  return "low";
}

function goalResetPoints(goal?: Goal, isHabit = false) {
  if (isHabit) return 3;
  if (!goal) return 0;
  if (goal.system === "sys1" && goal.level === "primary") return 8;
  if (goal.system === "sys1" && goal.level === "secondary") return 5;
  if (goal.system === "sys1") return 3;
  if (goal.importance === "critical") return 2;
  return 0;
}

function statWeightsForDomain(domain?: LifeDomain): Partial<Record<StatName, number>> {
  if (!domain) return {};

  const map: Record<LifeDomain, Partial<Record<StatName, number>>> = {
    academics: { focus: 40, intelligence: 60 },
    discipline_routine: { discipline: 70, focus: 30 },
    finance: { discipline: 40, perception: 60 },
    fitness_health: { discipline: 30, vitality: 70 },
    personality_social_confidence: { discipline: 40, perception: 60 },
    skills_career: { focus: 45, intelligence: 55 }
  };

  return map[domain];
}

function slotStatusToWorkStatus(status: QuestSlot["status"]): WorkItemStatus {
  const map: Record<QuestSlot["status"], WorkItemStatus> = {
    active: "started",
    completed: "completed",
    expired: "expired",
    pending: "offered",
    skipped: "skipped"
  };

  return map[status];
}

function attemptStatusToWorkStatus(status: TaskAttempt["status"]): WorkItemStatus {
  const map: Record<TaskAttempt["status"], WorkItemStatus> = {
    completed: "completed",
    failed: "expired",
    incomplete: "postponed",
    postponed: "postponed",
    skipped: "skipped",
    started: "started"
  };

  return map[status];
}

function dedupeById(items: WorkItem[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}
