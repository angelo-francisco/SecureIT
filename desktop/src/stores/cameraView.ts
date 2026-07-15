import { create } from "zustand";

interface CameraViewState {
  cameraId: number | null;
  setCameraId: (id: number | null) => void;
}

export const useCameraViewStore = create<CameraViewState>((set) => ({
  cameraId: null,
  setCameraId: (cameraId) => set({ cameraId }),
}));
