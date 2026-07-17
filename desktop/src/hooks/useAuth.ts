import { create } from "zustand";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User, SignupFormData } from "../types";
import type { AccountResponse } from "../api-client/auth";
import { authApi } from "../api-client";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  accounts: AccountResponse[];
  pinVerified: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setAccounts: (accounts: AccountResponse[]) => void;
  setPinVerified: (verified: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem("access_token"),
  accounts: [],
  pinVerified: false,
  setUser: (user) => set({ user }),
  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem("access_token", token);
    } else {
      localStorage.removeItem("access_token");
    }
    set({ accessToken: token });
  },
  setAccounts: (accounts) => set({ accounts }),
  setPinVerified: (verified) => set({ pinVerified: verified }),
  clearAuth: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("remembered_account");
    set({ user: null, accessToken: null, pinVerified: false, accounts: [] });
  },
}));

export function useAuth() {
  const store = useAuthStore();
  const queryClient = useQueryClient();

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login({ email, password });
      store.setAccessToken("authenticated");
      store.setUser(res.user);
      return res;
    },
    [store]
  );

  const signup = useCallback(
    async (data: SignupFormData) => {
      const res = await authApi.signup({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        password: data.password,
      });
      return res;
    },
    [store]
  );

  const sendEmailCode = useCallback(async (email: string) => {
    await authApi.sendEmailCode(email);
  }, []);

  const verifyEmailCode = useCallback(
    async (email: string, code: string) => {
      const res = await authApi.verifyEmailCode({ email, code });
      store.setAccessToken("authenticated");
      store.setUser(res.user);
      return res;
    },
    [store]
  );

  const verifyTOTP = useCallback(
    async (code: string) => {
      const res = await authApi.verifyTOTP({ code });
      return res;
    },
    [store]
  );

  const fetchMe = useCallback(async () => {
    try {
      const res = await authApi.me();
      store.setUser(res.user);
      return res.user;
    } catch {
      store.clearAuth();
      return null;
    }
  }, [store]);

  const verifyPin = useCallback(async () => {
    if (!store.user) throw new Error("Utilizador não autenticado");
    await authApi.verifyPin(store.user.email, "");
    store.setPinVerified(true);
  }, [store]);

  const logout = useCallback(() => {
    store.clearAuth();
    queryClient.clear();
  }, [store, queryClient]);

  return {
    user: store.user,
    accessToken: store.accessToken,
    isAuthenticated: !!store.accessToken,
    pinVerified: store.pinVerified,
    accounts: store.accounts,
    login,
    signup,
    sendEmailCode,
    verifyEmailCode,
    verifyTOTP,
    fetchMe,
    verifyPin,
    logout,
  };
}
