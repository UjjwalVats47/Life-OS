import { afterEach, describe, expect, it, vi } from "vitest";
import {
  checkOllamaConnection,
  refineGoalTaskPlanWithOllama
} from "@/system/ai/ollamaGoalTaskAdapter";
import { generateGoalTaskIntelligence } from "@/system/tasks/goalTaskIntelligenceEngine";
import type { Goal } from "@/types/domain";

const goal: Goal = {
  availableResources: "Laptop and Python 3",
  createdAt: "2026-07-30T00:00:00.000Z",
  currentLevel: "Beginner",
  domain: "skills_career",
  id: "goal-local-ai",
  importance: "critical",
  level: "primary",
  priorityWeight: 100,
  progress: 0,
  reason: "Build independent software ability",
  status: "active",
  system: "sys1",
  targetOutcome: "Complete an intermediate Python project",
  timelineMonths: 6,
  title: "Become good at coding",
  updatedAt: "2026-07-30T00:00:00.000Z",
  userId: "private-user-id"
};

afterEach(() => vi.unstubAllGlobals());

describe("ollamaGoalTaskAdapter", () => {
  it("detects installed local models", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ models: [{ name: "phi3:latest" }] }), { status: 200 })
    ));

    await expect(checkOllamaConnection()).resolves.toEqual({
      available: true,
      models: ["phi3:latest"]
    });
  });

  it("accepts only locally refined actions that still pass deterministic validation", async () => {
    const deterministic = generateGoalTaskIntelligence({ goal });
    const original = deterministic.tasks[0];
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            content: JSON.stringify({
              refinements: [
                {
                  completionEvidence: "One saved Python practice PDF, its source, and the verified question count.",
                  description: "Locate one beginner Python set that contains solutions and at least ten questions.",
                  estimatedMinutes: 25,
                  instructions: ["Search using the supplied query.", "Open the answer section before saving the file."],
                  resourceQuery: "beginner Python practice PDF ten questions with solutions",
                  taskKey: original.taskKey,
                  title: "Save one ten-question Python practice set with solutions"
                }
              ]
            })
          }
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await refineGoalTaskPlanWithOllama({
      deterministic,
      goal,
      model: "phi3:latest"
    });
    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { messages: Array<{ content: string }> };

    expect(result.acceptedRefinements).toBe(1);
    expect(result.tasks[0].generationSource).toBe("local_ai");
    expect(result.tasks[0].title).toContain("ten-question Python");
    expect(sentBody.messages[1].content).not.toContain(goal.userId);
  });

  it("falls back per action when a local model returns a vague task", async () => {
    const deterministic = generateGoalTaskIntelligence({ goal });
    const original = deterministic.tasks[0];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            content: JSON.stringify({
              refinements: [
                {
                  completionEvidence: "A note claiming the broad practice activity was completed today.",
                  description: "Spend some time getting better without a bounded output or resource.",
                  estimatedMinutes: 30,
                  instructions: ["Open a coding tool.", "Do some general practice."],
                  taskKey: original.taskKey,
                  title: "Practice coding for a while"
                }
              ]
            })
          }
        }),
        { status: 200 }
      )
    ));

    const result = await refineGoalTaskPlanWithOllama({ deterministic, goal, model: "phi3:latest" });

    expect(result.acceptedRefinements).toBe(0);
    expect(result.tasks[0]).toEqual(original);
  });

  it("does not let the local model overwrite an explicit user adjustment", async () => {
    const deterministic = generateGoalTaskIntelligence({
      feedback: [{ feedbackType: "rejected", reasonCode: "too_long", taskKey: "coding-resource" }],
      goal
    });
    const adjusted = deterministic.tasks[0];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            content: JSON.stringify({
              refinements: [{
                completionEvidence: "A completely different completion proof supplied by the model.",
                description: "A model proposal that should not replace explicit user feedback.",
                estimatedMinutes: 120,
                instructions: ["Ignore the saved preference.", "Use the longer model version."],
                taskKey: adjusted.taskKey,
                title: "Replace the user-adjusted action with a much longer model proposal"
              }]
            })
          }
        }),
        { status: 200 }
      )
    ));

    const result = await refineGoalTaskPlanWithOllama({ deterministic, goal, model: "phi3:latest" });

    expect(result.acceptedRefinements).toBe(0);
    expect(result.tasks[0]).toEqual(adjusted);
    expect(result.tasks[0].generationSource).toBe("user_feedback");
  });
});
