import type { AiAdapter } from "@/system/ai/aiAdapter";

export const localAiAdapter: AiAdapter = {
  async complete() {
    throw new Error("Local AI adapter is a future placeholder.");
  }
};
