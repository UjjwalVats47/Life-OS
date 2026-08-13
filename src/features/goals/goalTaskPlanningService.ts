import { db } from "@/db/lifeOsDb";
import { defaultUserProfileId } from "@/db/repositories/profileRepo";
import { nowIso } from "@/lib/dates";
import { createId } from "@/lib/ids";
import {
  generateGoalTaskIntelligence,
  isGeneratedTaskEligible,
  scoreGeneratedTaskSpecificity,
  validateGeneratedTask,
  type GoalTaskFeedbackSignal,
  type GoalTaskHistorySignal
} from "@/system/tasks/goalTaskIntelligenceEngine";
import { selectBestTaskOptions } from "@/system/tasks/taskGenerationEngine";
import { syncWorkItemsFromExistingData } from "@/system/work/workItemEngine";
import { loadAiSettings } from "@/features/settings/settingsService";
import { refineGoalTaskPlanWithOllama } from "@/system/ai/ollamaGoalTaskAdapter";
import type {
  Goal,
  GoalActionFeedback,
  GoalActionFeedbackReason,
  GoalActionPlan,
  QuestSlot,
  QuestSlotOption,
  TaskTemplate
} from "@/types/domain";

export type GoalTaskPlanView = {
  completedActions: number;
  completedTaskIds: string[];
  feedbackCount: number;
  goal: Goal;
  plan?: GoalActionPlan;
  tasks: TaskTemplate[];
  totalActions: number;
};

export type GeneratedActionEditInput = {
  completionEvidence: string;
  estimatedMinutes: number;
  instructions: string[];
  title: string;
};

export type GeneratedActionRejectionInput = {
  reasonCode: GoalActionFeedbackReason;
  reasonText?: string;
};

export type GoalCalibrationInput = {
  availableResources: string;
  constraints: string;
  currentLevel: string;
  targetOutcome: string;
};

export async function updateGoalCalibration(goalId: string, input: GoalCalibrationInput) {
  const timestamp = nowIso();
  const goal = await db.goals.get(goalId);
  if (!goal || goal.userId !== defaultUserProfileId) throw new Error("Goal was not found.");
  await db.goals.update(goalId, {
    availableResources: cleanOptional(input.availableResources),
    constraints: cleanOptional(input.constraints),
    currentLevel: cleanOptional(input.currentLevel),
    targetOutcome: cleanOptional(input.targetOutcome),
    updatedAt: timestamp
  });
  return regenerateGoalTaskPlan(goalId);
}

export async function loadGoalTaskPlans(): Promise<GoalTaskPlanView[]> {
  const userId = defaultUserProfileId;
  const [goals, plans, tasks, attempts, feedback] = await Promise.all([
    db.goals.where("userId").equals(userId).toArray(),
    db.goalActionPlans.where("userId").equals(userId).toArray(),
    db.taskTemplates.where("userId").equals(userId).toArray(),
    db.taskAttempts.where("userId").equals(userId).toArray(),
    db.goalActionFeedback.where("userId").equals(userId).toArray()
  ]);
  const completedTemplateIds = new Set(
    attempts.filter((attempt) => attempt.status === "completed").map((attempt) => attempt.taskTemplateId)
  );

  return goals
    .filter((goal) => goal.status === "active")
    .sort((a, b) => b.priorityWeight - a.priorityWeight)
    .map((goal) => {
      const plan = plans
        .filter((plan) => plan.goalId === goal.id && plan.status === "active")
        .sort((a, b) => b.version - a.version)[0];
      const planTasks = tasks
        .filter((task) => task.goalId === goal.id && task.status === "active" && task.goalPlanId === plan?.id)
        .sort((a, b) => (a.sequenceIndex ?? 99) - (b.sequenceIndex ?? 99));
      return {
        completedActions: planTasks.filter((task) => completedTemplateIds.has(task.id)).length,
        completedTaskIds: planTasks.filter((task) => completedTemplateIds.has(task.id)).map((task) => task.id),
        feedbackCount: feedback.filter((item) => item.goalId === goal.id).length,
        goal,
        plan,
        tasks: planTasks,
        totalActions: planTasks.length
      };
    });
}

export async function editGeneratedAction(taskTemplateId: string, input: GeneratedActionEditInput) {
  const task = await loadEditableAction(taskTemplateId);
  const title = input.title.trim();
  const completionEvidence = input.completionEvidence.trim();
  const instructions = input.instructions.map((item) => item.trim()).filter(Boolean);
  const candidate: TaskTemplate = {
    ...task,
    completionEvidence,
    estimatedMinutes: Math.round(input.estimatedMinutes),
    generationSource: "user_edit",
    instructions,
    specificityScore: 0,
    title
  };
  candidate.specificityScore = scoreGeneratedTaskSpecificity(candidate);
  const validation = validateGeneratedTask(candidate);
  if (!validation.valid) throw new Error(`The edited action is not executable: ${validation.issues.join(", ")}.`);

  const timestamp = nowIso();
  const feedback = createFeedbackRecord(task, {
    feedbackType: "edited",
    revisedCompletionEvidence: completionEvidence,
    revisedEstimatedMinutes: candidate.estimatedMinutes,
    revisedInstructions: instructions,
    revisedTitle: title
  });
  await db.transaction("rw", [db.goalActionFeedback, db.taskTemplates], async () => {
    await db.goalActionFeedback.put(feedback);
    await db.taskTemplates.update(task.id, {
      completionEvidence,
      estimatedMinutes: candidate.estimatedMinutes,
      generationSource: "user_edit",
      instructions,
      specificityScore: candidate.specificityScore,
      title,
      updatedAt: timestamp
    });
  });
  await rebuildTodayQuestBoard();
  return task.goalId;
}

export async function rejectGeneratedAction(taskTemplateId: string, input: GeneratedActionRejectionInput) {
  const task = await loadEditableAction(taskTemplateId);
  const feedback = createFeedbackRecord(task, {
    feedbackType: "rejected",
    reasonCode: input.reasonCode,
    reasonText: input.reasonText?.trim() || undefined
  });
  await db.goalActionFeedback.put(feedback);
  return regenerateGoalTaskPlan(task.goalId!);
}

export async function resetGoalActionFeedback(goalId: string) {
  const goal = await db.goals.get(goalId);
  if (!goal || goal.userId !== defaultUserProfileId) throw new Error("Goal was not found.");
  const feedback = await db.goalActionFeedback.where("goalId").equals(goalId).toArray();
  if (feedback.length) await db.goalActionFeedback.bulkDelete(feedback.map((item) => item.id));
  return regenerateGoalTaskPlan(goalId);
}

export async function regenerateGoalTaskPlan(goalId: string) {
  const userId = defaultUserProfileId;
  const goal = await db.goals.get(goalId);
  if (!goal || goal.userId !== userId) throw new Error("Goal was not found.");

  const [existingPlans, existingTemplates, attempts, feedbackRecords] = await Promise.all([
    db.goalActionPlans.where("goalId").equals(goalId).toArray(),
    db.taskTemplates.where("goalId").equals(goalId).toArray(),
    db.taskAttempts.where("userId").equals(userId).toArray(),
    db.goalActionFeedback.where("goalId").equals(goalId).toArray()
  ]);
  const templateById = new Map(existingTemplates.map((template) => [template.id, template]));
  const history = attempts
    .filter(
      (attempt) =>
        templateById.has(attempt.taskTemplateId) &&
        (attempt.status === "completed" ||
          attempt.status === "postponed" ||
          attempt.status === "skipped" ||
          attempt.status === "incomplete" ||
          attempt.status === "failed")
    )
    .map<GoalTaskHistorySignal>((attempt) => ({
      actualMinutes: attempt.actualMinutes,
      actionType: templateById.get(attempt.taskTemplateId)?.actionType,
      difficultyFeedback: attempt.difficultyFeedback,
      plannedMinutes: templateById.get(attempt.taskTemplateId)?.estimatedMinutes,
      resultScore: attempt.resultScore,
      status: toHistoryStatus(attempt.status),
      taskKey: templateById.get(attempt.taskTemplateId)?.taskKey
    }));
  const version = Math.max(0, ...existingPlans.map((plan) => plan.version)) + 1;
  const feedback = feedbackRecords
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map<GoalTaskFeedbackSignal>((item) => ({
      actionType: item.actionType,
      feedbackType: item.feedbackType,
      reasonCode: item.reasonCode,
      reasonText: item.reasonText,
      revisedCompletionEvidence: item.revisedCompletionEvidence,
      revisedEstimatedMinutes: item.revisedEstimatedMinutes,
      revisedInstructions: item.revisedInstructions,
      revisedTitle: item.revisedTitle,
      taskKey: item.taskKey
    }));
  const deterministic = generateGoalTaskIntelligence({ feedback, goal, history, planVersion: version });
  const aiSettings = await loadAiSettings();
  let generated = deterministic;
  let localAiStatus: "disabled" | "refined" | "fallback" = "disabled";
  let localAiDetail = "Deterministic engine used.";
  if (aiSettings.localAiEnabled && aiSettings.mode === "local_ai") {
    try {
      const refined = await refineGoalTaskPlanWithOllama({
        baseUrl: aiSettings.ollamaBaseUrl,
        deterministic,
        goal,
        model: aiSettings.localModel
      });
      generated = refined;
      localAiStatus = "refined";
      localAiDetail = `${refined.acceptedRefinements} actions passed local validation using ${refined.model}.`;
    } catch (error) {
      localAiStatus = "fallback";
      localAiDetail = error instanceof Error ? error.message : "Local refinement failed validation.";
    }
  }
  const planId = createId();
  const timestamp = nowIso();
  const invalidTasks = generated.tasks
    .map((task) => ({ task, validation: validateGeneratedTask(task) }))
    .filter(({ validation }) => !validation.valid);

  if (invalidTasks.length) {
    throw new Error(`The engine rejected ${invalidTasks.length} vague or invalid generated actions.`);
  }

  const plan: GoalActionPlan = {
    ...generated.plan,
    createdAt: timestamp,
    id: planId,
    updatedAt: timestamp,
    userId
  };
  const templates = generated.tasks.map<TaskTemplate>((task) => ({
    ...task,
    createdAt: timestamp,
    goalPlanId: planId,
    id: createId(),
    updatedAt: timestamp,
    userId
  }));

  await db.transaction("rw", [db.goalActionPlans, db.taskTemplates], async () => {
    await Promise.all(
      existingPlans
        .filter((item) => item.status === "active")
        .map((item) => db.goalActionPlans.update(item.id, { status: "outdated", updatedAt: timestamp }))
    );
    await Promise.all(
      existingTemplates
        .filter((item) => Boolean(item.goalPlanId) && item.status === "active")
        .map((item) => db.taskTemplates.update(item.id, { status: "archived", updatedAt: timestamp }))
    );
    await db.goalActionPlans.put(plan);
    if (templates.length) await db.taskTemplates.bulkPut(templates);
  });

  await db.aiInteractions.put({
    contextType: "goal_action_plan",
    createdAt: timestamp,
    id: createId(),
    inputSummary: `Goal ${goal.id}; calibration, current active plan history, and deterministic candidates only.`,
    mode: localAiStatus === "refined" ? "local_ai" : "rule_based",
    outputText: `${localAiStatus}: ${localAiDetail}`,
    tone: "strategic_mentor",
    userId
  });

  await rebuildTodayQuestBoard();
  return { localAiDetail, localAiStatus, plan, tasks: templates };
}

export async function advanceGoalPlanIfComplete(goalId: string) {
  const activePlan = await db.goalActionPlans
    .where("goalId")
    .equals(goalId)
    .filter((plan) => plan.status === "active")
    .first();
  if (!activePlan) return false;

  const [templates, attempts] = await Promise.all([
    db.taskTemplates.where("goalId").equals(goalId).filter((task) => task.goalPlanId === activePlan.id && task.status === "active").toArray(),
    db.taskAttempts.where("userId").equals(defaultUserProfileId).toArray()
  ]);
  if (!templates.length) return false;
  const completedTemplateIds = new Set(
    attempts.filter((attempt) => attempt.status === "completed").map((attempt) => attempt.taskTemplateId)
  );
  if (!templates.every((template) => completedTemplateIds.has(template.id))) return false;

  await regenerateGoalTaskPlan(goalId);
  return true;
}

export async function rebuildTodayQuestBoard() {
  const userId = defaultUserProfileId;
  const timestamp = nowIso();
  const date = timestamp.slice(0, 10);
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
  const [freeBlocks, templates, goals, attempts, slots, options] = await Promise.all([
    db.freeBlocks.where("userId").equals(userId).toArray(),
    db.taskTemplates.where("userId").equals(userId).toArray(),
    db.goals.where("userId").equals(userId).toArray(),
    db.taskAttempts.where("userId").equals(userId).toArray(),
    db.questSlots.where("userId").equals(userId).toArray(),
    db.questSlotOptions.where("userId").equals(userId).toArray()
  ]);
  const templateById = new Map(templates.map((template) => [template.id, template]));
  const completedTaskKeys = new Set(
    attempts
      .filter((attempt) => attempt.status === "completed")
      .map((attempt) => templateById.get(attempt.taskTemplateId)?.taskKey)
      .filter((key): key is string => Boolean(key))
  );
  const attemptedTemplateIds = new Set(
    attempts
      .filter((attempt) => attempt.status === "completed" || attempt.status === "started")
      .map((attempt) => attempt.taskTemplateId)
  );
  const eligible = templates.filter(
    (template) =>
      template.status === "active" &&
      !attemptedTemplateIds.has(template.id) &&
      isGeneratedTaskEligible(template, completedTaskKeys)
  );
  const goalById = new Map(goals.map((goal) => [goal.id, goal]));
  const todaySlots = slots.filter((slot) => slot.date === date);
  const protectedSlots = todaySlots.filter((slot) => slot.status === "active" || slot.status === "completed");
  const replaceableSlots = todaySlots.filter((slot) => slot.status === "pending" || slot.status === "expired" || slot.status === "skipped");
  const replaceableSlotIds = new Set(replaceableSlots.map((slot) => slot.id));
  const replaceableOptionIds = options.filter((option) => replaceableSlotIds.has(option.questSlotId)).map((option) => option.id);
  const occupied = protectedSlots.map((slot) => ({ start: toMinutes(slot.startTime), end: toMinutes(slot.endTime) }));
  const availableBlocks = freeBlocks
    .filter((block) => block.dayOfWeek === dayOfWeek)
    .filter((block) => !occupied.some((item) => overlaps(toMinutes(block.startTime), toMinutes(block.endTime), item.start, item.end)))
    .filter((block) => toMinutes(block.endTime) - toMinutes(block.startTime) >= 15)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const newSlots: QuestSlot[] = [];
  const newOptions: QuestSlotOption[] = [];
  const assignedTemplateIds = new Set<string>();

  for (const block of availableBlocks) {
    const blockMinutes = Math.min(90, toMinutes(block.endTime) - toMinutes(block.startTime));
    const candidates = eligible
      .filter((template) => !assignedTemplateIds.has(template.id))
      .map((template) => {
        const goal = template.goalId ? goalById.get(template.goalId) : undefined;
        return {
          deadlinePressure: calculateDeadlinePressure(goal?.deadlineAt),
          estimatedMinutes: template.estimatedMinutes,
          id: template.id,
          postponementCount: attempts.filter(
            (attempt) => attempt.taskTemplateId === template.id && (attempt.status === "postponed" || attempt.status === "incomplete")
          ).length,
          preferredTimeMatch: preferredTimeMatch(template, block.startTime),
          priorityWeight: goal?.priorityWeight ?? (template.habitId ? 55 : 35),
          routine: Boolean(template.habitId),
          weakArea: template.actionType === "review_mistakes" || template.domain === "personality_social_confidence"
        };
      });
    const selected = selectBestTaskOptions(candidates, blockMinutes, 2);
    if (!selected.length) continue;

    const slotId = createId();
    const slotMinutes = Math.max(...selected.map((candidate) => candidate.estimatedMinutes));
    newSlots.push({
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
    selected.forEach((candidate, index) => {
      const template = templateById.get(candidate.id)!;
      assignedTemplateIds.add(candidate.id);
      newOptions.push({
        createdAt: timestamp,
        id: createId(),
        questSlotId: slotId,
        rank: (index + 1) as 1 | 2,
        score: candidate.score,
        status: "offered",
        systemReason: buildSystemReason(candidate.systemReason, template),
        taskTemplateId: candidate.id,
        updatedAt: timestamp,
        userId
      });
    });
    if (newSlots.length >= 3 || assignedTemplateIds.size >= eligible.length) break;
  }

  await db.transaction("rw", [db.questSlotOptions, db.questSlots], async () => {
    if (replaceableOptionIds.length) await db.questSlotOptions.bulkDelete(replaceableOptionIds);
    if (replaceableSlots.length) await db.questSlots.bulkDelete(replaceableSlots.map((slot) => slot.id));
    if (newSlots.length) await db.questSlots.bulkPut(newSlots);
    if (newOptions.length) await db.questSlotOptions.bulkPut(newOptions);
  });

  await syncWorkItemsFromExistingData(userId);

  return { options: newOptions, slots: newSlots };
}

function buildSystemReason(scoreReason: string, template: TaskTemplate) {
  const parts = [scoreReason, template.description, template.completionEvidence ? `Proof: ${template.completionEvidence}` : undefined];
  return parts.filter(Boolean).join(". ");
}

async function loadEditableAction(
  taskTemplateId: string
): Promise<TaskTemplate & { goalId: string; goalPlanId: string; taskKey: string }> {
  const task = await db.taskTemplates.get(taskTemplateId);
  if (!task || task.userId !== defaultUserProfileId || !task.goalId || !task.goalPlanId || !task.taskKey) {
    throw new Error("Generated action was not found.");
  }
  const attempts = await db.taskAttempts.where("taskTemplateId").equals(task.id).toArray();
  if (attempts.some((attempt) => attempt.status === "started" || attempt.status === "completed")) {
    throw new Error("A started or completed action cannot be edited or rejected. Its execution evidence must remain intact.");
  }
  return task as TaskTemplate & { goalId: string; goalPlanId: string; taskKey: string };
}

function createFeedbackRecord(
  task: TaskTemplate & { goalId: string; goalPlanId: string; taskKey: string },
  input: Pick<
    GoalActionFeedback,
    | "feedbackType"
    | "reasonCode"
    | "reasonText"
    | "revisedCompletionEvidence"
    | "revisedEstimatedMinutes"
    | "revisedInstructions"
    | "revisedTitle"
  >
): GoalActionFeedback {
  const timestamp = nowIso();
  return {
    actionType: task.actionType,
    createdAt: timestamp,
    feedbackType: input.feedbackType,
    goalId: task.goalId,
    goalPlanId: task.goalPlanId,
    id: createId(),
    originalCompletionEvidence: task.completionEvidence ?? "",
    originalEstimatedMinutes: task.estimatedMinutes,
    originalInstructions: task.instructions ?? [],
    originalTitle: task.title,
    reasonCode: input.reasonCode,
    reasonText: input.reasonText,
    revisedCompletionEvidence: input.revisedCompletionEvidence,
    revisedEstimatedMinutes: input.revisedEstimatedMinutes,
    revisedInstructions: input.revisedInstructions,
    revisedTitle: input.revisedTitle,
    taskKey: task.taskKey,
    taskTemplateId: task.id,
    updatedAt: timestamp,
    userId: task.userId
  };
}

function cleanOptional(value: string) {
  const cleaned = value.trim();
  return cleaned || undefined;
}

function toHistoryStatus(status: "started" | "completed" | "incomplete" | "skipped" | "postponed" | "failed"): GoalTaskHistorySignal["status"] {
  if (status === "completed" || status === "postponed" || status === "skipped") return status;
  return "incomplete";
}

function calculateDeadlinePressure(deadlineAt?: string) {
  if (!deadlineAt) return 0.3;
  const days = Math.ceil((new Date(deadlineAt).getTime() - Date.now()) / 86_400_000);
  if (days <= 7) return 1;
  if (days <= 30) return 0.85;
  if (days <= 90) return 0.65;
  if (days <= 180) return 0.45;
  return 0.25;
}

function preferredTimeMatch(template: TaskTemplate, startTime: string) {
  const hour = Number(startTime.split(":")[0]);
  if (template.actionType === "baseline_assessment" || template.actionType === "timed_practice") {
    return hour >= 8 && hour <= 13 ? 1 : 0.55;
  }
  if (template.actionType === "review_mistakes") return hour >= 16 && hour <= 21 ? 0.9 : 0.7;
  return 0.75;
}

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && endA > startB;
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
