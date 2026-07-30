import { z } from "zod";
import {
  scoreGeneratedTaskSpecificity,
  validateGeneratedTask,
  type GeneratedTaskDraft,
  type GoalTaskIntelligenceResult
} from "@/system/tasks/goalTaskIntelligenceEngine";
import type { Goal } from "@/types/domain";

export type OllamaConnection = {
  available: boolean;
  error?: string;
  models: string[];
};

export type OllamaGoalTaskResult = GoalTaskIntelligenceResult & {
  acceptedRefinements: number;
  model: string;
};

const refinementSchema = z.object({
  refinements: z.array(
    z.object({
      completionEvidence: z.string().min(12).max(500),
      description: z.string().min(12).max(600),
      estimatedMinutes: z.number().int().min(5).max(180),
      instructions: z.array(z.string().min(5).max(300)).min(2).max(6),
      resourceQuery: z.string().max(300).optional(),
      taskKey: z.string().min(2).max(120),
      title: z.string().min(12).max(180)
    })
  ).max(8)
});

export async function checkOllamaConnection(baseUrl = "http://127.0.0.1:11434"): Promise<OllamaConnection> {
  try {
    const response = await fetch(`${normaliseBaseUrl(baseUrl)}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(4_000)
    });
    if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}.`);
    const payload = (await response.json()) as { models?: Array<{ name?: string; model?: string }> };
    const models = (payload.models ?? [])
      .map((item) => item.name ?? item.model)
      .filter((name): name is string => Boolean(name));
    return { available: true, models };
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : "Ollama could not be reached.",
      models: []
    };
  }
}

export async function refineGoalTaskPlanWithOllama(input: {
  baseUrl?: string;
  deterministic: GoalTaskIntelligenceResult;
  goal: Goal;
  model: string;
}): Promise<OllamaGoalTaskResult> {
  const response = await fetch(`${normaliseBaseUrl(input.baseUrl ?? "http://127.0.0.1:11434")}/api/chat`, {
    body: JSON.stringify({
      format: "json",
      messages: [
        {
          content:
            "You refine concrete Life OS actions. Never return a broad goal as a task. Every action needs an exact operation, bounded duration, ordered instructions, and inspectable completion proof. Do not change taskKey or add hidden dependencies. Return JSON only.",
          role: "system"
        },
        {
          content: JSON.stringify({
            goal: {
              availableResources: input.goal.availableResources,
              constraints: input.goal.constraints,
              currentLevel: input.goal.currentLevel,
              deadlineAt: input.goal.deadlineAt,
              reason: input.goal.reason,
              targetOutcome: input.goal.targetOutcome,
              title: input.goal.title
            },
            outputShape: {
              refinements: [
                {
                  completionEvidence: "inspectable proof",
                  description: "why and what",
                  estimatedMinutes: 30,
                  instructions: ["step one", "step two"],
                  resourceQuery: "optional search query",
                  taskKey: "copy the supplied taskKey exactly",
                  title: "specific executable action"
                }
              ]
            },
            tasksToRefine: input.deterministic.tasks.map((task) => ({
              completionEvidence: task.completionEvidence,
              description: task.description,
              estimatedMinutes: task.estimatedMinutes,
              instructions: task.instructions,
              resourceQuery: task.resourceQuery,
              taskKey: task.taskKey,
              title: task.title
            }))
          }),
          role: "user"
        }
      ],
      model: input.model,
      options: { temperature: 0.15 },
      stream: false
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(90_000)
  });
  if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}.`);
  const payload = (await response.json()) as { message?: { content?: string }; response?: string };
  const content = payload.message?.content ?? payload.response;
  if (!content) throw new Error("Ollama returned no structured action proposal.");
  const parsed = refinementSchema.parse(JSON.parse(content));
  const refinementByKey = new Map(parsed.refinements.map((task) => [task.taskKey, task]));
  let acceptedRefinements = 0;

  const tasks = input.deterministic.tasks.map<GeneratedTaskDraft>((task) => {
    const refinement = task.taskKey ? refinementByKey.get(task.taskKey) : undefined;
    if (!refinement) return task;
    const candidate: GeneratedTaskDraft = {
      ...task,
      completionEvidence: refinement.completionEvidence,
      description: refinement.description,
      estimatedMinutes: refinement.estimatedMinutes,
      generationSource: "local_ai",
      instructions: refinement.instructions,
      resourceQuery: refinement.resourceQuery?.trim() || undefined,
      specificityScore: 0,
      title: refinement.title
    };
    candidate.specificityScore = scoreGeneratedTaskSpecificity(candidate);
    if (!validateGeneratedTask(candidate).valid) return task;
    acceptedRefinements += 1;
    return candidate;
  });

  return {
    ...input.deterministic,
    acceptedRefinements,
    model: input.model,
    tasks
  };
}

function normaliseBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "");
}
