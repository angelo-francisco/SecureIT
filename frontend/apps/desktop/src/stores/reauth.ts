import { create } from "zustand";

interface ReAuthState {
  pending: boolean;
  attempts: number;
  cooldownUntil: number | null;
  show: () => Promise<void>;
  dismiss: () => void;
  fail: () => boolean;
  succeed: () => void;
}

let resolveReAuth: ((value: void | PromiseLike<void>) => void) | null = null;
let rejectReAuth: ((reason: Error) => void) | null = null;

export const useReAuthStore = create<ReAuthState>((set, get) => ({
  pending: false,
  attempts: 0,
  cooldownUntil: null,
  show: () => {
    return new Promise<void>((resolve, reject) => {
      resolveReAuth = resolve;
      rejectReAuth = reject;
      set({ pending: true });
    });
  },
  dismiss: () => {
    rejectReAuth?.(new Error("Re-autenticação cancelada"));
    resolveReAuth = null;
    rejectReAuth = null;
    set({ pending: false });
  },
  fail: () => {
    const attempts = get().attempts + 1;
    if (attempts >= 3) {
      set({ attempts, cooldownUntil: Date.now() + 15000 });
      setTimeout(() => set({ cooldownUntil: null, attempts: 0 }), 15000);
      return true;
    }
    set({ attempts });
    return false;
  },
  succeed: () => {
    const cb = resolveReAuth;
    resolveReAuth = null;
    rejectReAuth = null;
    set({ pending: false, attempts: 0, cooldownUntil: null });
    cb?.();
  },
}));
