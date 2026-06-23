import { create } from "zustand";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User, Account, SignupFormData } from "../types";
import type { SignupRequest } from "../types";
import { authApi } from "../api-client";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  pinToken: string | null;
  accounts: Account[];
  setAuth: (user: User, accessToken: string) => void;
  setPinToken: (token: string | null) => void;
  setAccounts: (accounts: Account[]) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: localStorage.getItem("access_token"),
  pinToken: null,
  accounts: [],
  setAuth: (user, accessToken) => {
    localStorage.setItem("access_token", accessToken);
    set({ user, accessToken });
  },
  setPinToken: (pinToken) => set({ pinToken }),
  setAccounts: (accounts) => set({ accounts }),
  clearAuth: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("remembered_account");
    set({ user: null, accessToken: null, pinToken: null, accounts: [] });
  },
}));

export function useAuth() {
  const store = useAuthStore();
  const queryClient = useQueryClient();

  const fetchAccounts = useCallback(async () => {
    const accounts = await authApi.accounts();
    store.setAccounts(accounts);
    return accounts;
  }, [store]);

  const pinLogin = useCallback(async (email: string, pin: string) => {
    const res = await authApi.pinLogin({ email, pin });
    store.setAuth(res.user, res.access_token);
    store.setPinToken(res.pin_token);
    return res;
  }, [store]);

  const signup = useCallback(async (data: SignupFormData) => {
    const body: SignupRequest = {
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      password: data.password,
      pin: data.pin,
    };
    const res = await authApi.signup(body);
    return res;
  }, [store]);

  const verifyPin = useCallback(async () => {
    const res = await authApi.verifyPin();
    store.setPinToken(res.pin_token);
    return res;
  }, [store]);

  const lock = useCallback(async () => {
    store.setPinToken(null);
    await authApi.lock().catch(() => {});
  }, [store]);

  const logout = useCallback(() => {
    store.clearAuth();
    queryClient.clear();
  }, [store, queryClient]);

  return {
    user: store.user,
    accounts: store.accounts,
    accessToken: store.accessToken,
    pinToken: store.pinToken,
    isAuthenticated: !!store.accessToken,
    pinVerified: !!store.pinToken,
    fetchAccounts,
    pinLogin,
    signup,
    verifyPin,
    lock,
    logout,
  };
}
