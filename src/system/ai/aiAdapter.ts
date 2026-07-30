import type { AiMode, SystemTone } from "@/types/enums";

export type AiRequest = {
  contextSummary?: string;
  contextType: string;
  input: string;
  mode: AiMode;
  tone: SystemTone;
};

export type AiResponse = {
  output: string;
};

export type AiAdapter = {
  complete: (request: AiRequest) => Promise<AiResponse>;
};
