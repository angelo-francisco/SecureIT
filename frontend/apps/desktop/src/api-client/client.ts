const log = (...args: unknown[]) => console.log("[ApiClient]", ...args);
const err = (...args: unknown[]) => console.error("[ApiClient]", ...args);

export function getBearerToken(): string | null {
  return localStorage.getItem("access_token");
}

interface RequestConfig {
  method?: string;
  body?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  skipReAuth?: boolean;
}

let globalReAuthPromise: Promise<void> | null = null;

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (config.params) {
      Object.entries(config.params).forEach(([k, v]) =>
        url.searchParams.set(k, v)
      );
    }

    const headers: Record<string, string> = {
      ...config.headers,
    };

    const token = getBearerToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (config.body && !(config.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url.toString(), {
      method: config.method ?? "GET",
      headers,
      body: config.body
        ? config.body instanceof FormData
          ? config.body
          : JSON.stringify(config.body)
        : undefined,
    });

    if (!res.ok) {
      err(String(res));

      if (res.status === 401 && !config.skipReAuth) {
        log(`401 on ${path} — starting/awaiting re-auth`);
        const { useReAuthStore } = await import("../stores/reauth");
        const store = useReAuthStore.getState();

        if (!globalReAuthPromise) {
          globalReAuthPromise = store
            .show()
            .then(() => {
              log("Re-auth succeeded, retrying", path);
            })
            .catch((err: Error) => {
              log("Re-auth failed/cancelled:", err.message);
              throw err;
            })
            .finally(() => {
              globalReAuthPromise = null;
            });
        } else {
          log("Re-auth already in progress, waiting...");
        }

        await globalReAuthPromise;
        log("Retrying", path, "with refreshed token");
        return this.request<T>(path, config);
      }

      let message = "Erro inesperado. Tente novamente.";
      try {
        const body = await res.json();
        if (typeof body?.detail === "string") {
          message = body.detail;
        } else if (Array.isArray(body?.detail)) {
          message = body.detail.map((d: { msg?: string }) => d.msg || "").filter(Boolean).join("; ");
        } else if (typeof body?.error === "string") {
          message = body.error;
        } else if (typeof body?.message === "string") {
          message = body.message;
        }
      } catch {
        // body is not JSON
      }
      log(`Error on ${path}:`, message);
      throw new Error(message);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { params });
  }

  async post<T>(path: string, body?: unknown, skipReAuth?: boolean): Promise<T> {
    return this.request<T>(path, { method: "POST", body, skipReAuth });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PUT", body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const apiClient = new ApiClient(API_BASE);

export function getApiBaseUrl(): string {
  return API_BASE;
}

export function getWsBaseUrl(): string {
  return API_BASE.replace(/^http/, "ws");
}
