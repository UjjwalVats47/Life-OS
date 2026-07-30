import { db } from "@/db/lifeOsDb";
import { defaultUserProfileId } from "@/db/repositories/profileRepo";
import type { AwakeningDraft } from "@/features/awakening/types";
import { createId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import { generateEventPrepPlan } from "@/system/events/eventPrepEngine";
import { generateStarterHabits } from "@/system/habits/habitGenerationEngine";
import { getBaseXp } from "@/system/gamification/xpEngine";
import { detectFreeBlocks } from "@/system/scheduling/slotDetection";
import { selectBestTaskOptions } from "@/system/tasks/taskGenerationEngine";
import { createFirstWeekProtocol } from "@/system/awakening/firstWeekProtocol";
import { projectWorkItemsFromRecords } from "@/system/work/workItemEngine";
import type {
  Commitment,
  EventPrepItem,
  FreeBlock,
  Goal,
  Habit,
  IdentityPath,
  LifeEvent,
  PersonalityProfile,
  QuestSlot,
  QuestSlotOption,
  ScheduleBlock,
  TargetHabit,
  TaskTemplate,
  UserProfile
} from "@/types/domain";
import type { LifeDomain, StatName } from "@/types/enums";

export async function activateAwakeningProtocol(draft: AwakeningDraft) {
  const selected = draft.identityOptions.find((option) => option.name === draft.selectedIdentityName);

  if (!selected) {
    throw new Error("Select an identity before activation.");
  }

  const timestamp = nowIso();
  const userId = defaultUserProfileId;
  const activeIdentityId = createId();
  const goalRecords = createGoals(draft, userId, timestamp);
  const scheduleRecords = createScheduleBlocks(draft, userId, timestamp);
  const commitmentRecords = createCommitments(draft, userId, timestamp);
  const freeBlocks = createFreeBlocks(scheduleRecords, commitmentRecords, userId, timestamp);
  const identityRecords = draft.identityOptions.map<IdentityPath>((option) => ({
    ...option,
    id: option.name === selected.name ? activeIdentityId : createId(),
    createdAt: timestamp,
    desiredDirectionInput: draft.desiredDirection || undefined,
    status: option.name === selected.name ? "active" : draft.desiredDirection ? "refined" : "suggested",
    updatedAt: timestamp,
    userId
  }));
  const habitSuggestions = generateStarterHabits(selected.pillars.length ? selected.pillars : goalRecords.map((goal) => goal.domain));
  const habitRecords = habitSuggestions.map<Habit>((habit) => ({
    ...habit,
    id: createId(),
    createdAt: timestamp,
    status: "active",
    updatedAt: timestamp,
    userId
  }));
  const taskTemplates = createTaskTemplates(goalRecords, habitRecords, userId, timestamp);
  const { questOptions, questSlots } = createInitialQuests(freeBlocks, taskTemplates, goalRecords, userId, timestamp);
  const events = createEvents(draft, userId, timestamp);
  const eventPrepItems = createEventPrepItems(events, userId, timestamp);
  const firstWeekProtocol = createFirstWeekProtocol({
    goals: goalRecords,
    habits: habitRecords,
    identityName: selected.name,
    startDate: timestamp.slice(0, 10),
    userId
  });
  const workItems = projectWorkItemsFromRecords({
    commitments: commitmentRecords,
    eventPrepItems,
    events,
    goals: goalRecords,
    habits: habitRecords,
    questSlots,
    scheduleBlocks: scheduleRecords,
    taskAttempts: [],
    taskTemplates,
    timestamp,
    userId
  });

  await db.transaction(
    "rw",
    [
      db.appMeta,
      db.commitments,
      db.eventPrepItems,
      db.events,
      db.freeBlocks,
      db.goals,
      db.habits,
      db.identityPaths,
      db.personalityProfiles,
      db.questSlotOptions,
      db.questSlots,
      db.scheduleBlocks,
      db.targetHabits,
      db.taskTemplates,
      db.userProfiles,
      db.workItems
    ],
    async () => {
      await Promise.all([
        db.commitments.where("userId").equals(userId).delete(),
        db.eventPrepItems.where("userId").equals(userId).delete(),
        db.events.where("userId").equals(userId).delete(),
        db.freeBlocks.where("userId").equals(userId).delete(),
        db.goals.where("userId").equals(userId).delete(),
        db.habits.where("userId").equals(userId).delete(),
        db.identityPaths.where("userId").equals(userId).delete(),
        db.personalityProfiles.where("userId").equals(userId).delete(),
        db.questSlotOptions.where("userId").equals(userId).delete(),
        db.questSlots.where("userId").equals(userId).delete(),
        db.scheduleBlocks.where("userId").equals(userId).delete(),
        db.targetHabits.where("userId").equals(userId).delete(),
        db.taskTemplates.where("userId").equals(userId).delete(),
        db.workItems.where("userId").equals(userId).delete()
      ]);

      const profile: UserProfile = {
        activeIdentityPathId: activeIdentityId,
        basePersonalTimeHoursPerWeek: 7,
        createdAt: timestamp,
        currentPersonalTimeHoursPerWeek: 7,
        displayName: draft.displayName.trim(),
        id: userId,
        onboardingCompleted: true,
        updatedAt: timestamp
      };
      const personality: PersonalityProfile = {
        agreeableness: draft.agreeableness,
        conscientiousness: draft.conscientiousness,
        createdAt: timestamp,
        extraversion: draft.extraversion,
        id: createId(),
        mbtiType: draft.mbtiType.trim() || undefined,
        neuroticism: draft.neuroticism,
        notes: draft.currentState.trim(),
        openness: draft.openness,
        updatedAt: timestamp,
        userId
      };
      const targetHabits = draft.problemAreasText
        .split(",")
        .map((problem) => problem.trim())
        .filter(Boolean)
        .map<TargetHabit>((title) => ({
          createdAt: timestamp,
          domain: inferProblemDomain(title),
          id: createId(),
          severity: "moderate",
          status: "active",
          title,
          updatedAt: timestamp,
          userId
        }));

      await db.userProfiles.put(profile);
      await db.personalityProfiles.put(personality);
      await db.appMeta.put({
        createdAt: timestamp,
        id: "awakening-current-state",
        key: "awakeningCurrentState",
        updatedAt: timestamp,
        value: draft.currentState.trim()
      });
      await db.appMeta.put({
        createdAt: timestamp,
        id: `first-week-protocol-${userId}`,
        key: "firstWeekProtocol",
        updatedAt: timestamp,
        value: firstWeekProtocol
      });
      await Promise.all([
        db.commitments.bulkPut(commitmentRecords),
        db.eventPrepItems.bulkPut(eventPrepItems),
        db.events.bulkPut(events),
        db.freeBlocks.bulkPut(freeBlocks),
        db.goals.bulkPut(goalRecords),
        db.habits.bulkPut(habitRecords),
        db.identityPaths.bulkPut(identityRecords),
        db.questSlotOptions.bulkPut(questOptions),
        db.questSlots.bulkPut(questSlots),
        db.scheduleBlocks.bulkPut(scheduleRecords),
        db.targetHabits.bulkPut(targetHabits),
        db.taskTemplates.bulkPut(taskTemplates),
        db.workItems.bulkPut(workItems)
      ]);
    }
  );

  return { activeIdentityId, questCount: questSlots.length };
}

function createGoals(draft: AwakeningDraft, userId: string, timestamp: string) {
  return draft.goals.map<Goal>((goal, index) => ({
    createdAt: timestamp,
    deadlineAt: addMonthsIso(goal.timelineMonths),
    domain: goal.domain,
    id: createId(),
    importance: goal.level === "primary" ? "critical" : "negotiable",
    level: goal.level,
    priorityWeight: goal.level === "primary" ? 100 - index : 65 - index,
    progress: 0,
    reason: goal.reason.trim(),
    status: "active",
    system: goal.level === "primary" ? "sys1" : "sys2",
    timelineMonths: goal.timelineMonths,
    title: goal.title.trim(),
    updatedAt: timestamp,
    userId
  }));
}

function createScheduleBlocks(draft: AwakeningDraft, userId: string, timestamp: string) {
  return draft.fixedBlocks.flatMap<ScheduleBlock>((block) =>
    (block.dayOfWeeks?.length ? block.dayOfWeeks : [block.dayOfWeek]).map((dayOfWeek) => ({
      blockType: block.blockType,
      createdAt: timestamp,
      dayOfWeek,
      endTime: block.endTime,
      id: createId(),
      startTime: block.startTime,
      title: block.title,
      updatedAt: timestamp,
      userId
    }))
  );
}

function createCommitments(draft: AwakeningDraft, userId: string, timestamp: string) {
  return draft.commitments.flatMap<Commitment>((commitment) =>
    (commitment.dayOfWeeks?.length ? commitment.dayOfWeeks : [commitment.dayOfWeek]).map((dayOfWeek) => ({
      commitmentType: commitment.commitmentType,
      createdAt: timestamp,
      dayOfWeek,
      domain: commitment.domain,
      endTime: commitment.endTime,
      id: createId(),
      startTime: commitment.startTime,
      title: commitment.title,
      updatedAt: timestamp,
      userId
    }))
  );
}

function createFreeBlocks(
  blocks: ScheduleBlock[],
  commitments: Commitment[],
  userId: string,
  timestamp: string
) {
  const records: FreeBlock[] = [];

  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek += 1) {
    const occupied = [...blocks, ...commitments]
      .filter((item) => item.dayOfWeek === dayOfWeek)
      .map((item) => ({ startMinutes: toMinutes(item.startTime), endMinutes: toMinutes(item.endTime) }));
    const detected = detectFreeBlocks(occupied, {
      dayEndMinutes: 23 * 60,
      dayStartMinutes: 6 * 60,
      minimumBlockMinutes: 30
    });

    for (const block of detected) {
      records.push({
        createdAt: timestamp,
        dayOfWeek,
        endTime: toTime(block.endMinutes),
        id: createId(),
        sourceHash: `${dayOfWeek}:${block.startMinutes}-${block.endMinutes}`,
        startTime: toTime(block.startMinutes),
        updatedAt: timestamp,
        userId
      });
    }
  }

  return records;
}

function createTaskTemplates(goals: Goal[], habits: Habit[], userId: string, timestamp: string) {
  const goalTasks = goals.map<TaskTemplate>((goal) => {
    const category = goal.level === "primary" ? "critical" : "negotiable";
    return {
      baseXp: getBaseXp(category),
      category,
      createdAt: timestamp,
      difficulty: "normal",
      domain: goal.domain,
      estimatedMinutes: goal.level === "primary" ? 60 : 45,
      goalId: goal.id,
      id: createId(),
      statWeights: statWeightsForDomain(goal.domain),
      status: "active",
      title: `Advance: ${goal.title}`,
      updatedAt: timestamp,
      userId
    };
  });
  const habitTasks = habits.map<TaskTemplate>((habit) => ({
    baseXp: getBaseXp("small"),
    category: "small",
    createdAt: timestamp,
    difficulty: habit.difficulty,
    domain: habit.domain,
    estimatedMinutes: habit.difficulty === "easy" ? 15 : 30,
    habitId: habit.id,
    id: createId(),
    statWeights: statWeightsForDomain(habit.domain),
    status: "active",
    title: habit.title,
    updatedAt: timestamp,
    userId
  }));

  return [...goalTasks, ...habitTasks];
}

function createInitialQuests(
  freeBlocks: FreeBlock[],
  templates: TaskTemplate[],
  goals: Goal[],
  userId: string,
  timestamp: string
) {
  const date = timestamp.slice(0, 10);
  const dayOfWeek = new Date().getDay();
  const todayBlocks = freeBlocks
    .filter((block) => block.dayOfWeek === dayOfWeek)
    .filter((block) => toMinutes(block.endTime) - toMinutes(block.startTime) >= 30)
    .slice(0, 3);
  const questSlots: QuestSlot[] = [];
  const questOptions: QuestSlotOption[] = [];

  for (const block of todayBlocks) {
    const slotId = createId();
    const slotMinutes = Math.min(90, toMinutes(block.endTime) - toMinutes(block.startTime));
    const options = selectBestTaskOptions(
      templates.map((template) => {
        const goal = goals.find((item) => item.id === template.goalId);
        return {
          deadlinePressure: goal?.level === "primary" ? 0.7 : 0.3,
          estimatedMinutes: template.estimatedMinutes,
          id: template.id,
          postponementCount: 0,
          preferredTimeMatch: 0.7,
          priorityWeight: goal?.priorityWeight ?? 55,
          routine: Boolean(template.habitId),
          weakArea: template.domain === "personality_social_confidence"
        };
      }),
      slotMinutes
    );

    if (!options.length) continue;

    questSlots.push({
      createdAt: timestamp,
      date,
      dayOfWeek,
      endTime: toTime(toMinutes(block.startTime) + slotMinutes),
      id: slotId,
      phase: "phase1",
      sourceFreeBlockId: block.id,
      startTime: block.startTime,
      status: "pending",
      updatedAt: timestamp,
      userId
    });
    options.forEach((option, index) => {
      questOptions.push({
        createdAt: timestamp,
        id: createId(),
        questSlotId: slotId,
        rank: (index + 1) as 1 | 2,
        score: option.score,
        status: "offered",
        systemReason: option.systemReason,
        taskTemplateId: option.id,
        updatedAt: timestamp,
        userId
      });
    });
  }

  return { questOptions, questSlots };
}

function createEvents(draft: AwakeningDraft, userId: string, timestamp: string) {
  return draft.events.map<LifeEvent>((event) => ({
    ...event,
    createdAt: timestamp,
    id: createId(),
    status: "planned",
    updatedAt: timestamp,
    userId
  }));
}

function createEventPrepItems(events: LifeEvent[], userId: string, timestamp: string) {
  return events.flatMap((event) =>
    generateEventPrepPlan(event).map<EventPrepItem>((step) => ({
      createdAt: timestamp,
      eventId: event.id,
      id: createId(),
      scheduledDate: step.scheduledDate,
      status: "draft",
      updatedAt: timestamp,
      userId
    }))
  );
}

function statWeightsForDomain(domain: LifeDomain): Partial<Record<StatName, number>> {
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

function inferProblemDomain(problem: string): LifeDomain {
  const value = problem.toLowerCase();
  if (value.includes("social") || value.includes("confidence")) return "personality_social_confidence";
  if (value.includes("money") || value.includes("spend")) return "finance";
  if (value.includes("fitness") || value.includes("health") || value.includes("sleep")) return "fitness_health";
  if (value.includes("study") || value.includes("academic")) return "academics";
  if (value.includes("skill") || value.includes("career") || value.includes("coding")) return "skills_career";
  return "discipline_routine";
}

function addMonthsIso(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
