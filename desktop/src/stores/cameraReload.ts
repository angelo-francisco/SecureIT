import { create } from "zustand";

interface CameraReloadState {
  all: number;
  perCamera: Record<number, number>;
  requestReload: (cameraId: number) => void;
  requestReloadAll: () => void;
}

export const useCameraReloadStore = create<CameraReloadState>((set) => ({
  all: 0,
  perCamera: {},
  requestReload: (cameraId) =>
    set((s) => ({
      perCamera: {
        ...s.perCamera,
        [cameraId]: (s.perCamera[cameraId] ?? 0) + 1,
      },
    })),
  requestReloadAll: () => set((s) => ({ all: s.all + 1 })),
}));
