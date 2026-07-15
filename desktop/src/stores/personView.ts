import { create } from "zustand";

interface PersonViewState {
  personId: number | null;
  setPersonId: (id: number | null) => void;
}

export const usePersonViewStore = create<PersonViewState>((set) => ({
  personId: null,
  setPersonId: (personId) => set({ personId }),
}));
