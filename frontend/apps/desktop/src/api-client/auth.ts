import type {
  Account,
  PinLoginData,
  PinLoginTokenResponse,
  SignupRequest,
  AuthResponse,
  ReAuthData,
} from "../types";
import { apiClient } from "./client";

export const authApi = {
  accounts: () =>
    apiClient.get<Account[]>("/api/auth/accounts"),

  pinLogin: (data: PinLoginData) =>
    apiClient.post<PinLoginTokenResponse>("/api/auth/pin-login", data),

  signup: (data: SignupRequest) =>
    apiClient.post<AuthResponse>("/api/auth/signup", data),

  verifyPin: () =>
    apiClient.post<{ pin_token: string }>("/api/auth/pin"),

  lock: () => apiClient.post<{ message: string }>("/api/auth/lock"),

  check: () => apiClient.get<{ valid: boolean }>("/api/auth/check"),

  reAuth: (data: ReAuthData) =>
    apiClient.post<PinLoginTokenResponse>("/api/auth/re-auth", data, true),
};
