import { create } from "zustand";
import {
  createInitialAwakeningDraft,
  type AwakeningDraft
} from "@/features/awakening/types";

type AwakeningState = {
  currentStep: number;
  draft: AwakeningDraft;
  reset: () => void;
  setCurrentStep: (currentStep: number) => void;
  updateDraft: (update: Partial<AwakeningDraft>) => void;
};

export const useAwakeningStore = create<AwakeningState>((set) => ({
  currentStep: 0,
  draft: createInitialAwakeningDraft(),
  reset: () => set({ currentStep: 0, draft: createInitialAwakeningDraft() }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  updateDraft: (update) =>
    set((state) => ({
      draft: { ...state.draft, ...update }
    }))
}));
