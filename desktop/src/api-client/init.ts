import { listen } from "@tauri-apps/api/event";
import { initApiBase, isRunningInTauri } from "./api-base";

export interface BootstrapProgress {
  component: string;
  downloaded: number;
  total: number | null;
  message: string;
}

export interface BootstrapState {
  progress: BootstrapProgress | null;
  error: string | null;
  apiBase: string | null;
}

let state: BootstrapState = { progress: null, error: null, apiBase: null };
const listeners = new Set<() => void>();

function notify() {
  for (const cb of listeners) cb();
}

export function getBootstrapState(): BootstrapState {
  return state;
}

export function onBootstrapChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export async function initAppRuntime(): Promise<void> {
  if (state.apiBase || state.error) {
    state = { ...state, error: null };
  }
  if (isRunningInTauri()) {
    try {
      await listen<BootstrapProgress>("bootstrap-progress", (e) => {
        state = { ...state, progress: e.payload };
        notify();
      });
    } catch {
      // event bus unavailable — proceed without progress
    }
  }
  try {
    const apiBase = await initApiBase();
    state = { ...state, apiBase };
  } catch (e) {
    state = { ...state, error: e instanceof Error ? e.message : String(e) };
  }
  notify();
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
