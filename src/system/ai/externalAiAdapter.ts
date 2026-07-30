import type { AiAdapter } from "@/system/ai/aiAdapter";

export const externalAiAdapter: AiAdapter = {
  async complete() {
    throw new Error("External AI is disabled by default and requires explicit enablement.");
  }
};
