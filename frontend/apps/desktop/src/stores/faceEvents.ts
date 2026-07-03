import { create } from "zustand";

export interface FaceEvent {
  id: number;
  person_id: number | null;
  name: string | null;
  unknown: boolean;
  confidence: number;
  camera_id: number;
  camera_name: string;
  timestamp: number;
}

interface FaceEventsState {
  events: FaceEvent[];
  addEvent: (event: Omit<FaceEvent, "id">) => void;
  clearEvents: () => void;
}

let nextId = 0;

export const useFaceEventsStore = create<FaceEventsState>((set) => ({
  events: [],
  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, { ...event, id: nextId++ }].slice(-100),
    })),
  clearEvents: () => set({ events: [] }),
}));
