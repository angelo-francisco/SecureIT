import { invoke } from "@tauri-apps/api/core";

const FALLBACK = "http://localhost:8000";

let cachedBase: string | null = null;
let resolving: Promise<string> | null = null;

export function isRunningInTauri(): boolean {
  return (
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
  );
}

/**
 * Resolve the API base URL. Inside the Tauri shell this invokes the
 * `get_api_url` command (the FastAPI backend is spawned on a free port);
 * otherwise it falls back to VITE_API_URL / localhost:8000.
 *
 * Call this once (e.g. in main.tsx) before rendering so the synchronous
 * getters below return the resolved URL.
 */
export async function initApiBase(): Promise<string> {
  if (cachedBase) return cachedBase;
  if (!resolving) {
    resolving = (async (): Promise<string> => {
      let resolved: string;
      if (isRunningInTauri()) {
        // Inside the shell the backend is managed by Rust: resolve it there
        // (bootstrap + spawn) and surface failures so the UI can offer retry.
        resolved = await invoke<string>("get_api_url");
        cachedBase = resolved;
        return resolved;
      }
      resolved = import.meta.env.VITE_API_URL ?? FALLBACK;
      cachedBase = resolved;
      return resolved;
    })();
  }
  return resolving;
}

export function getApiBaseUrl(): string {
  return cachedBase ?? import.meta.env.VITE_API_URL ?? FALLBACK;
}

export function getWsBaseUrl(): string {
  return getApiBaseUrl().replace(/^http/, "ws");
}

export function getWebBaseUrl(): string {
  return (import.meta.env.VITE_WEB_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    ""
  );
}
