import { db } from "@/db/lifeOsDb";
import { defaultUserProfileId } from "@/db/repositories/profileRepo";
import { createId } from "@/lib/ids";
import { nowIso } from "@/lib/dates";
import {
  advanceGoalPlanIfComplete,
  rebuildTodayQuestBoard
} from "@/features/goals/goalTaskPlanningService";
import { getActiveRank, getUnlockedRank } from "@/system/gamification/rankEngine";
import { calculateResetPoints } from "@/system/gamification/resetPointEngine";
import { calculateStatAwards } from "@/system/gamification/statEngine";
import {
  calculateXp,
  type GoalLink
} from "@/system/gamification/xpEngine";
import { evaluateSkipRequest, getEscalationPhase } from "@/system/tasks/escalationEngine";
import {
  deriveEvidenceScore,
  createTaskEvidenceFields,
  summarizeEvidence,
  validateTaskEvidence
} from "@/system/tasks/taskEvidenceEngine";
import type {
  Goal,
  QuestSlot,
  QuestSlotOption,
  TaskAttempt,
  TaskTemplate
} from "@/types/domain";

export type QuestBoardOptionView = {
  option: QuestSlotOption;
  template: TaskTemplate;
};

export type QuestBoardSlotView = {
  activeAttempt?: TaskAttempt;
  options: QuestBoardOptionView[];
  slot: QuestSlot;
};

export type QuestCompletionDetails = {
  actualMinutes?: number;
  completionProof?: string;
  difficultyFeedback?: TaskAttempt["difficultyFeedback"];
  evidenceValues?: Record<string, unknown>;
  resultScore?: number;
  resultSummary?: string;
};

export async function loadQuestBoard(): Promise<QuestBoardSlotView[]> {
  const userId = defaultUserProfileId;
  const date = new Date().toISOString().slice(0, 10);
  const slots = await db.questSlots.where("userId").equals(userId).filter((slot) => slot.date === date).toArray();
  const options = await db.questSlotOptions.where("userId").equals(userId).toArray();
  const templates = await db.taskTemplates.where("userId").equals(userId).toArray();
  const attempts = await db.taskAttempts.where("userId").equals(userId).toArray();

  return slots
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((slot) => ({
      activeAttempt: attempts.find(
        (attempt) => attempt.questSlotId === slot.id && attempt.status === "started"
      ),
      options: options
        .filter((option) => option.questSlotId === slot.id)
        .sort((a, b) => a.rank - b.rank)
        .map((option) => ({
          option,
          template: ensureEvidenceContract(templates.find((template) => template.id === option.taskTemplateId)!)
        }))
        .filter((view) => Boolean(view.template)),
      slot
    }));
}

export async function startQuest(slotId: string, optionId: string) {
  const timestamp = nowIso();

  return db.transaction(
    "rw",
    [db.questSlots, db.questSlotOptions, db.taskAttempts, db.taskTemplates, db.workItems],
    async () => {
      const slot = await db.questSlots.get(slotId);
      const option = await db.questSlotOptions.get(optionId);

      if (!slot || !option || option.questSlotId !== slotId) {
        throw new Error("Quest option is no longer available.");
      }
      const template = await db.taskTemplates.get(option.taskTemplateId);
      if (!template) throw new Error("Generated task details are unavailable.");

      const existing = await db.taskAttempts
        .where("userId")
        .equals(slot.userId)
        .filter((attempt) => attempt.questSlotId === slotId && attempt.status === "started")
        .first();

      if (existing) return existing;

      const attempt: TaskAttempt = {
        createdAt: timestamp,
        id: createId(),
        questSlotId: slotId,
        startedAt: timestamp,
        status: "started",
        taskTemplateId: option.taskTemplateId,
        updatedAt: timestamp,
        userId: slot.userId
      };

      const selectedEndTime = addMinutes(slot.startTime, template.estimatedMinutes);
      await db.questSlots.update(slotId, { endTime: selectedEndTime, status: "active", updatedAt: timestamp });
      await db.workItems.update(`work-quest_slot-${slotId}`, {
        endTime: selectedEndTime,
        plannedMinutes: template.estimatedMinutes,
        preferredMinutes: template.estimatedMinutes,
        status: "started",
        updatedAt: timestamp
      });
      await db.workItems.update(`work-task_template-${option.taskTemplateId}`, {
        status: "started",
        updatedAt: timestamp
      });
      const siblingOptions = await db.questSlotOptions.where("questSlotId").equals(slotId).toArray();
      await Promise.all(
        siblingOptions.map((item) =>
          db.questSlotOptions.update(item.id, {
            status: item.id === optionId ? "selected" : "rejected",
            updatedAt: timestamp
          })
        )
      );
      await db.taskAttempts.put(attempt);

      return attempt;
    }
  );
}

export async function finishQuest(
  attemptId: string,
  outcome: "completed" | "incomplete",
  details: QuestCompletionDetails = {}
) {
  const timestamp = nowIso();

  const result = await db.transaction(
    "rw",
    [
      db.goals,
      db.questSlots,
      db.rankSnapshots,
      db.resetPointLogs,
      db.statLogs,
      db.streaks,
      db.taskAttempts,
      db.taskTemplates,
      db.workItems,
      db.xpLogs
    ],
    async () => {
      const attempt = await db.taskAttempts.get(attemptId);
      if (!attempt) throw new Error("Task attempt was not found.");

      const template = await db.taskTemplates.get(attempt.taskTemplateId);
      const slot = await db.questSlots.get(attempt.questSlotId);
      if (!template || !slot) throw new Error("Quest data is incomplete.");
      const evidenceFields = ensureEvidenceContract(template).evidenceFields ?? [];
      const evidence = validateTaskEvidence(
        evidenceFields,
        details.evidenceValues,
        outcome === "completed"
      );
      if (!evidence.valid) throw new Error(evidence.errors.join(" "));
      const completionProof = details.completionProof?.trim() ||
        (Object.keys(evidence.normalized).length ? summarizeEvidence(evidence.normalized) : undefined);
      const resultSummary = details.resultSummary?.trim();
      const actualMinutes = clampOptional(details.actualMinutes, 1, 720);
      const resultScore = deriveEvidenceScore(
        evidence.normalized,
        clampOptional(details.resultScore, 0, 100)
      );

      if (outcome === "completed" && template.goalPlanId && !completionProof) {
        throw new Error("Generated actions require a short completion proof.");
      }

      if (outcome === "incomplete") {
        await db.taskAttempts.update(attemptId, {
          actualMinutes,
          difficultyFeedback: details.difficultyFeedback,
          evidenceValues: evidence.normalized,
          finishedAt: timestamp,
          incompleteReason: resultSummary || "Marked incomplete by user",
          resultScore,
          resultSummary,
          status: "incomplete",
          updatedAt: timestamp
        });
        await db.questSlots.update(slot.id, { status: "pending", updatedAt: timestamp });
        await db.workItems.update(`work-quest_slot-${slot.id}`, {
          status: "postponed",
          updatedAt: timestamp
        });
        await db.workItems.update(`work-task_template-${template.id}`, {
          actualMinutes,
          status: "postponed",
          updatedAt: timestamp
        });
        return { resetPoints: 0, statAwards: {}, xp: 0 };
      }

      const goal = template.goalId ? await db.goals.get(template.goalId) : undefined;
      const streak = await db.streaks
        .where("userId")
        .equals(attempt.userId)
        .filter((item) => item.streakType === "daily")
        .first();
      const xpInput = {
        category: template.category,
        difficulty: template.difficulty,
        goalLink: getGoalLink(goal),
        socialConfidence: template.domain === "personality_social_confidence",
        streakDays: streak?.currentCount ?? 0,
        timing: "on_time" as const,
        weakArea: template.domain === "personality_social_confidence"
      };
      const xp = calculateXp(xpInput);
      const statAwards = calculateStatAwards(
        template.category,
        template.difficulty,
        "on_time",
        template.statWeights
      );
      const expectedResetPoints = getExpectedResetPoints(goal, Boolean(template.habitId));
      const resetPoints = calculateResetPoints(expectedResetPoints, xp, xp);

      await db.taskAttempts.update(attemptId, {
        actualMinutes,
        completionTiming: "on_time",
        completionProof,
        difficultyFeedback: details.difficultyFeedback,
        evidenceValues: evidence.normalized,
        finishedAt: timestamp,
        resultScore,
        resultSummary,
        status: "completed",
        updatedAt: timestamp
      });
      await db.questSlots.update(slot.id, { status: "completed", updatedAt: timestamp });
      await db.workItems.update(`work-quest_slot-${slot.id}`, {
        actualMinutes,
        status: "completed",
        updatedAt: timestamp
      });
      await db.workItems.update(`work-task_template-${template.id}`, {
        actualMinutes,
        status: "completed",
        updatedAt: timestamp
      });
      await db.xpLogs.put({
        amount: xp,
        createdAt: timestamp,
        formulaSnapshot: JSON.stringify(xpInput),
        goalId: goal?.id,
        habitId: template.habitId,
        id: createId(),
        reason: `Completed ${template.title}`,
        taskAttemptId: attemptId,
        userId: attempt.userId
      });
      await Promise.all(
        Object.entries(statAwards)
          .filter(([, amount]) => amount > 0)
          .map(([stat, amount]) =>
            db.statLogs.put({
              amount,
              createdAt: timestamp,
              id: createId(),
              stat: stat as keyof typeof statAwards,
              taskAttemptId: attemptId,
              userId: attempt.userId
            })
          )
      );
      if (resetPoints > 0) {
        await db.resetPointLogs.put({
          amount: resetPoints,
          createdAt: timestamp,
          goalId: goal?.id,
          id: createId(),
          performanceRatio: 1,
          reason: `Completed ${template.title}`,
          taskAttemptId: attemptId,
          userId: attempt.userId
        });
      }

      const nextStreak = (streak?.currentCount ?? 0) + 1;
      await db.streaks.put({
        createdAt: streak?.createdAt ?? timestamp,
        currentCount: nextStreak,
        id: streak?.id ?? createId(),
        lastSuccessDate: timestamp.slice(0, 10),
        longestCount: Math.max(streak?.longestCount ?? 0, nextStreak),
        streakType: "daily",
        updatedAt: timestamp,
        userId: attempt.userId
      });
      const lifetimeXp = (await db.xpLogs.where("userId").equals(attempt.userId).toArray()).reduce(
        (sum, log) => sum + log.amount,
        0
      );
      const unlockedRank = getUnlockedRank(lifetimeXp);
      const active = getActiveRank(unlockedRank, 90);
      await db.rankSnapshots.put({
        activeRank: active.activeRank,
        capturedAt: timestamp,
        createdAt: timestamp,
        id: createId(),
        lifetimeXp,
        recentBehaviorScore: 90,
        unlockedRank,
        userId: attempt.userId
      });

      return { resetPoints, statAwards, xp };
    }
  );

  const completedAttempt = await db.taskAttempts.get(attemptId);
  const completedTemplate = completedAttempt
    ? await db.taskTemplates.get(completedAttempt.taskTemplateId)
    : undefined;
  const advanced =
    outcome === "completed" && completedTemplate?.goalId
      ? await advanceGoalPlanIfComplete(completedTemplate.goalId)
      : false;
  if (!advanced) await rebuildTodayQuestBoard();
  return result;
}

export async function postponeQuest(
  slotId: string,
  reason: string,
  replacementType: "ordinary" | "emergency" | "recovery" = "ordinary"
) {
  const timestamp = nowIso();

  return db.transaction("rw", [db.questSlots, db.questSlotOptions, db.taskAttempts, db.workItems], async () => {
    const slot = await db.questSlots.get(slotId);
    const option = await db.questSlotOptions.where("questSlotId").equals(slotId).sortBy("rank");
    if (!slot || !option[0]) throw new Error("Quest slot is unavailable.");
    const permission = evaluateSkipRequest({ phase: slot.phase, reason, replacementType });

    if (!permission.allowed) {
      throw new Error("Phase 3 requires a confirmed reason or an emergency/recovery replacement.");
    }

    const previous = await db.taskAttempts
      .where("userId")
      .equals(slot.userId)
      .filter(
        (attempt) =>
          attempt.taskTemplateId === option[0].taskTemplateId &&
          (attempt.status === "postponed" || attempt.status === "incomplete")
      )
      .count();
    const phase = getEscalationPhase(previous + 1);

    await db.taskAttempts.put({
      createdAt: timestamp,
      id: createId(),
      incompleteReason:
        reason.trim() ||
        (replacementType === "ordinary" ? "No reason supplied" : `${replacementType} replacement selected`),
      questSlotId: slotId,
      status: "postponed",
      taskTemplateId: option[0].taskTemplateId,
      updatedAt: timestamp,
      userId: slot.userId
    });
    await db.questSlots.update(slotId, { phase, status: "pending", updatedAt: timestamp });
    await db.workItems.update(`work-quest_slot-${slotId}`, {
      priority: phase === "phase3" ? "critical" : "normal",
      status: "postponed",
      updatedAt: timestamp
    });
    await db.workItems.update(`work-task_template-${option[0].taskTemplateId}`, {
      status: "postponed",
      updatedAt: timestamp
    });

    return phase;
  });
}

function getGoalLink(goal?: Goal): GoalLink {
  if (!goal) return "unlinked";
  if (goal.system === "sys1" && goal.level === "primary") return "sys1_primary";
  if (goal.system === "sys1" && goal.level === "secondary") return "sys1_secondary";
  if (goal.system === "sys1") return "sys1_tertiary";
  if (goal.importance === "critical") return "sys2_critical";
  if (goal.importance === "negotiable") return "sys2_negotiable";
  return "sys2_optional";
}

function getExpectedResetPoints(goal?: Goal, isHabit = false) {
  if (isHabit) return 3;
  if (!goal) return 0;
  if (goal.system === "sys1" && goal.level === "primary") return 8;
  if (goal.system === "sys1" && goal.level === "secondary") return 5;
  if (goal.system === "sys1") return 3;
  if (goal.importance === "critical") return 2;
  return 0;
}

function addMinutes(startTime: string, durationMinutes: number) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const total = hours * 60 + minutes + durationMinutes;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

function clampOptional(value: number | undefined, minimum: number, maximum: number) {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

function ensureEvidenceContract(template: TaskTemplate) {
  if (!template || template.evidenceFields?.length || !template.goalPlanId) return template;
  return {
    ...template,
    evidenceFields: createTaskEvidenceFields(template.actionType, template.domain)
  };
}
