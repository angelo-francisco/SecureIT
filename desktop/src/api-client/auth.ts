import type {
  User,
  LoginRequest,
  EmailCodeData,
  TOTPVerifyData,
  AuthResponse,
} from "../types";

const WEB_BASE = import.meta.env.VITE_WEB_URL ?? "http://localhost:3000";

async function webFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${WEB_BASE}${path}`, {
    ...options,
    credentials: "include",
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

export interface AccountResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    webFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  sendEmailCode: (email: string) =>
    webFetch<{ success: boolean }>("/api/auth/email-code/send", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyEmailCode: (data: EmailCodeData) =>
    webFetch<AuthResponse>("/api/auth/email-code/verify", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyTOTP: (data: TOTPVerifyData) =>
    webFetch<{ success: boolean }>("/api/auth/totp/verify", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  accounts: () => webFetch<AccountResponse[]>("/api/auth/accounts"),

  pinLogin: (email: string, pin: string) =>
    webFetch<AuthResponse>("/api/auth/pin-login", {
      method: "POST",
      body: JSON.stringify({ email, pin }),
    }),

  verifyPin: (email: string, pin: string) =>
    webFetch<{ pin_token: string }>("/api/auth/pin", {
      method: "POST",
      body: JSON.stringify({ email, pin }),
    }),

  me: () =>
    webFetch<{ access_token: string; user: User }>("/api/auth/me"),

  refresh: () =>
    webFetch<{ access_token: string }>("/api/auth/refresh", {
      method: "POST",
    }),

  check: () => webFetch<{ valid: boolean }>("/api/auth/me"),
};
