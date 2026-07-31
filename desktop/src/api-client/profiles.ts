import { getWebBaseUrl } from "./api-base";

const WEB_BASE = getWebBaseUrl();

export interface ProfileData {
  id: string;
  name: string;
  avatarColor: string;
  isDefault: boolean;
  hasPin: boolean;
  createdAt?: string;
}

async function webFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${WEB_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Erro na requisição");
  }

  return data as T;
}

export const profilesApi = {
  list: () => webFetch<ProfileData[]>("/api/profiles"),

  create: (data: { name: string; avatarColor?: string; pin?: string }) =>
    webFetch<ProfileData>("/api/profiles", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  select: (id: string, pin?: string) =>
    webFetch<ProfileData>(`/api/profiles/${id}/select`, {
      method: "POST",
      body: JSON.stringify({ pin }),
    }),

  delete: (id: string) =>
    webFetch<{ ok: boolean }>(`/api/profiles/${id}`, {
      method: "DELETE",
    }),
};
