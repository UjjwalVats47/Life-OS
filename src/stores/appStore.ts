import { create } from "zustand";

type AppState = {
  aiMode: "rule_based" | "local_ai" | "external_ai";
  setAiMode: (mode: AppState["aiMode"]) => void;
};

export const useAppStore = create<AppState>((set) => ({
  aiMode: "rule_based",
  setAiMode: (aiMode) => set({ aiMode })
}));
