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

let globalRefreshPromise: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  try {
    const WEB_BASE = import.meta.env.VITE_WEB_URL ?? "http://localhost:3000";
    const res = await fetch(`${WEB_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const token = data.access_token;
    if (token) {
      localStorage.setItem("access_token", token);
    }
    return token;
  } catch {
    return null;
  }
}

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

    try {
      const userRaw = localStorage.getItem("user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user?.id) headers["UID"] = user.id;
      }
      const profileRaw = localStorage.getItem("selected_profile");
      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        if (profile?.id) headers["PID"] = profile.id;
      }
    } catch {}

    if (config.body && !(config.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    let res: Response;
    try {
      res = await fetch(url.toString(), {
        method: config.method ?? "GET",
        headers,
        body: config.body
          ? config.body instanceof FormData
            ? config.body
            : JSON.stringify(config.body)
          : undefined,
      });
    } catch (e) {
      if (e instanceof TypeError && /failed to fetch|network|load/i.test(e.message)) {
        throw new Error("Sem ligação à internet. Verifique a sua rede e tente novamente.");
      }
      throw e;
    }

    if (!res.ok) {
      err(String(res));

      if (res.status === 401 && !config.skipReAuth) {
        log(`401 on ${path} — attempting token refresh`);

        if (!globalRefreshPromise) {
          globalRefreshPromise = tryRefresh().finally(() => {
            globalRefreshPromise = null;
          });
        } else {
          log("Refresh already in progress, waiting...");
        }

        const newToken = await globalRefreshPromise;

        if (newToken) {
          log("Token refreshed, retrying", path);
          headers["Authorization"] = `Bearer ${newToken}`;
          res = await fetch(url.toString(), {
            method: config.method ?? "GET",
            headers,
            body: config.body
              ? config.body instanceof FormData
                ? config.body
                : JSON.stringify(config.body)
              : undefined,
          });

          if (res.ok) {
            if (res.status === 204) return undefined as T;
            return res.json();
          }
        }

        log("Refresh failed, falling back to re-auth modal");
        const { useReAuthStore } = await import("../stores/reauth");
        const store = useReAuthStore.getState();

        try {
          await store.show();
          log("Re-auth succeeded, retrying", path);
          return this.request<T>(path, { ...config, skipReAuth: true });
        } catch (reAuthErr: unknown) {
          log("Re-auth failed/cancelled:", reAuthErr);
          throw reAuthErr;
        }
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

const API_BASE = "http://localhost:8000";

export const apiClient = new ApiClient(API_BASE);

export function getApiBaseUrl(): string {
  return API_BASE;
}

export function getWsBaseUrl(): string {
  return API_BASE.replace(/^http/, "ws");
}
