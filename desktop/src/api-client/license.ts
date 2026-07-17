const WEB_BASE = import.meta.env.VITE_WEB_URL ?? "http://localhost:3000";

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

export interface LicenseData {
  valid: boolean;
  licenseId: string;
  expiresAt: string;
  activatedAt: string;
  type: "TRIAL" | "STANDARD";
  daysRemaining: number;
  error?: string;
}

export interface LicenseValidationResponse {
  valid: boolean;
  expiresAt: string;
  activatedAt: string;
  type: "TRIAL" | "STANDARD";
  isActive: boolean;
  daysRemaining: number;
  error?: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export const licenseApi = {
  activate: (data: {
    key: string;
    email: string;
    machineHash?: string;
  }) =>
    webFetch<LicenseData>("/api/licenses/activate", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  validate: (data: { licenseId: string; machineHash?: string }) =>
    webFetch<LicenseValidationResponse>("/api/licenses/validate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
