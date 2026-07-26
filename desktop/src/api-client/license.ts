const WEB_BASE = import.meta.env.VITE_WEB_URL ?? "http://localhost:3000";
const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function webFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${WEB_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Erro na requisição");
  }

  return data as T;
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || data.error || "Erro na requisição");
  }

  return data as T;
}

export interface ActivateResponse {
  valid: boolean;
  licenseId: string;
  expiresAt: string;
  activatedAt: string;
	type: "B2C" | "B2B";
  signedPayload: string;
  publicKey: string;
  maxCameras: number;
  maxPeople: number;
  features: string[];
  daysRemaining: number;
  error?: string;
}

export interface HeartbeatResponse {
  valid: boolean;
  expiresAt: string;
  type: string;
  isActive: boolean;
  revoked: boolean;
  daysRemaining: number;
  error?: string;
}

export interface LocalVerifyResponse {
  valid: boolean;
  license_id: string | null;
  license_key: string | null;
  license_type: string | null;
  activated_at: string | null;
  expires_at: string | null;
  last_validated_at: string | null;
  max_cameras: number;
  max_people: number;
  features: string[];
  status: string;
  days_remaining: number;
  reason: string | null;
}

export interface LocalLicenseResponse {
  exists: boolean;
  license_id?: string;
  license_key?: string;
  license_type?: string;
  activated_at?: string;
  expires_at?: string;
  last_validated_at?: string;
  max_cameras?: number;
  max_people?: number;
  features?: string[];
  status?: string;
  days_remaining?: number;
}

export const  licenseApi = {
  activate: (data: {
    key: string;
    email: string;
    hardwareFp?: string;
  }) =>
    webFetch<ActivateResponse>("/api/licenses/activate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  heartbeat: (data: { licenseId: string; hardwareFp?: string }) =>
    webFetch<HeartbeatResponse>("/api/licenses/heartbeat", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getFingerprint: () =>
    apiFetch<{ fingerprint: string }>("/api/license/fingerprint"),

  storeLocal: (data: {
    license_id: string;
    user_id: string;
    license_key: string;
    license_type: string;
    activated_at: string;
    expires_at: string;
    hardware_fingerprint: string;
    signed_payload: string;
    public_key: string;
    signature: string;
    max_cameras: number;
    max_people: number;
    features: string[];
    status: string;
  }) =>
    apiFetch<{ success: boolean; license_id: string }>("/api/license/store", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyLocal: (data: { user_id: string; hardware_fingerprint: string }) =>
    apiFetch<LocalVerifyResponse>("/api/license/verify", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyOnline: (data: { user_id: string }) =>
    apiFetch<LocalVerifyResponse>("/api/license/verify-online", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getCurrent: (userId: string) =>
    apiFetch<LocalLicenseResponse>(
      `/api/license/current?user_id=${encodeURIComponent(userId)}`
    ),

  clearLocal: (userId: string) =>
    apiFetch<{ success: boolean; deleted: boolean }>("/api/license/clear", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    }),

  checkFeatures: (userId: string) =>
    apiFetch<{
      allowed: boolean;
      reason: string | null;
      max_cameras: number;
      max_people: number;
      features: string[];
    }>("/api/license/features", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    }),

  revoke: () =>
    webFetch<{ success: boolean }>("/api/licenses/revoke", {
      method: "POST",
    }),
};
