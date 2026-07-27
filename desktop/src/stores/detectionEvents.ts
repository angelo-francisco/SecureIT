import { create } from "zustand";

export type DetectionType = "face" | "people" | "behaviour";

export interface DetectionEvent {
  id: number;
  type: DetectionType;
  person_id: number | null;
  name: string | null;
  unknown: boolean;
  confidence: number | null;
  camera_id: number;
  camera_name: string;
  timestamp: number;
}

interface DetectionEventsState {
  events: DetectionEvent[];
  addEvent: (event: Omit<DetectionEvent, "id">) => void;
  clearEvents: () => void;
}

let nextId = 0;

export const useDetectionEventsStore = create<DetectionEventsState>((set) => ({
  events: [],
  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, { ...event, id: nextId++ }].slice(-100),
    })),
  clearEvents: () => set({ events: [] }),
}));
