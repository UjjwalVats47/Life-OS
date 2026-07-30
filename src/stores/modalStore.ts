import { create } from "zustand";

type ModalState = {
  openModal?: string;
  setOpenModal: (openModal?: string) => void;
};

export const useModalStore = create<ModalState>((set) => ({
  openModal: undefined,
  setOpenModal: (openModal) => set({ openModal })
}));
