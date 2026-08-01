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
        try {
          resolved = await invoke<string>("get_api_url");
        } catch {
          // command unavailable (dev) — fall back to env
          resolved = import.meta.env.VITE_API_URL ?? FALLBACK;
        }
      } else {
        resolved = import.meta.env.VITE_API_URL ?? FALLBACK;
      }
      cachedBase = resolved;
      await logFrontendConfig();
      return resolved;
    })();
  }
  return resolving;
}

/**
 * Log the baked VITE_* values and the resolved base URLs into the Tauri
 * per-run log file, so they can be verified without opening devtools.
 * Never throws: logging must not break the app.
 */
async function logFrontendConfig(): Promise<void> {
  if (!isRunningInTauri()) return;
  try {
    await invoke("log_frontend_config", {
      envApiUrl: import.meta.env.VITE_API_URL ?? "",
      envWebUrl: import.meta.env.VITE_WEB_URL ?? "",
      apiBase: getApiBaseUrl(),
      webBase: getWebBaseUrl(),
    });
  } catch {
    // ignore
  }
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
