import { create } from "zustand";

const log = (...args: unknown[]) => console.log("[ReAuthStore]", ...args);

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
    log("show() called — pending = true");
    return new Promise<void>((resolve, reject) => {
      resolveReAuth = resolve;
      rejectReAuth = reject;
      set({ pending: true });
    });
  },
  dismiss: () => {
    log("dismiss() called — rejecting and closing modal");
    rejectReAuth?.(new Error("Re-autenticação cancelada"));
    resolveReAuth = null;
    rejectReAuth = null;
    set({ pending: false });
  },
  fail: () => {
    const attempts = get().attempts + 1;
    log("fail() called — attempt", attempts, "of 3");
    if (attempts >= 3) {
      set({ attempts, cooldownUntil: Date.now() + 15000 });
      setTimeout(() => set({ cooldownUntil: null, attempts: 0 }), 15000);
      return true;
    }
    set({ attempts });
    return false;
  },
  succeed: () => {
    log("succeed() called — resolving, new token saved");
    const cb = resolveReAuth;
    resolveReAuth = null;
    rejectReAuth = null;
    set({ pending: false, attempts: 0, cooldownUntil: null });
    cb?.();
  },
}));
