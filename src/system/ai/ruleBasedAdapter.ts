import type { AiAdapter } from "@/system/ai/aiAdapter";

export const ruleBasedAdapter: AiAdapter = {
  async complete(request) {
    const input = request.input.toLowerCase();
    const tonePrefix = toneLabel(request.tone);
    const action = chooseAction(input);
    const context = request.contextSummary ? ` Current state: ${request.contextSummary}` : "";

    return {
      output: `${tonePrefix}:${context} ${action}`
    };
  }
};

function toneLabel(tone: string) {
  const labels: Record<string, string> = {
    cold_architect: "Cold Architect",
    shadow_guard: "Shadow Guard",
    strategic_mentor: "Strategic Mentor"
  };

  return labels[tone] ?? "System";
}

function chooseAction(input: string) {
  if (input.includes("skip") || input.includes("avoid") || input.includes("later")) {
    return "Name the real reason first. If it is fatigue, choose recovery. If it is fear or friction, shrink the task to the next 10 minutes and begin.";
  }

  if (input.includes("stress") || input.includes("tired") || input.includes("burnout")) {
    return "Protect recovery without letting the day become shapeless. Pick one low-friction task, one recovery block, and one end-of-day log.";
  }

  if (input.includes("goal") || input.includes("identity")) {
    return "Connect the next task to the identity being built. A goal without a proof habit is still only an intention.";
  }

  if (input.includes("schedule") || input.includes("time")) {
    return "Lock fixed blocks first, place the highest-value quest in the cleanest free slot, then keep flexible tasks movable with a reason.";
  }

  return "Choose one concrete action that can be completed today. The System should measure behavior, not mood alone.";
}
