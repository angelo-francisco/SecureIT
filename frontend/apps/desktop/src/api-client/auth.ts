import type {
  User,
  LoginRequest,
  SignupRequest,
  EmailCodeData,
  TOTPVerifyData,
  AuthResponse,
} from "../types";
import { apiClient } from "./client";

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

export const authApi = {
  login: (data: LoginRequest) =>
    webFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  signup: (data: SignupRequest) =>
    webFetch<AuthResponse>("/api/auth/signup", {
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

  me: () => apiClient.get<{ user: User }>("/api/auth/me"),

  check: () => apiClient.get<{ valid: boolean }>("/api/auth/check"),
};
