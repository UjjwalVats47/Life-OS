import { create } from "zustand";

type QuestBoardState = {
  selectedSlotId?: string;
  setSelectedSlotId: (selectedSlotId?: string) => void;
};

export const useQuestBoardStore = create<QuestBoardState>((set) => ({
  selectedSlotId: undefined,
  setSelectedSlotId: (selectedSlotId) => set({ selectedSlotId })
}));
