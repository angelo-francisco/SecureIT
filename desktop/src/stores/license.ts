import { create } from "zustand";

interface LicenseData {
  licenseId: string | null;
  key: string | null;
	type: "B2C" | "B2B" | null;
  activatedAt: string | null;
  expiresAt: string | null;
  lastChecked: string | null;
  lastValidatedAt: string | null;
  maxCameras: number;
  maxPeople: number;
  features: string[];
  signedPayload: string | null;
  publicKey: string | null;
}

interface LicenseState extends LicenseData {
  isActive: boolean;
  daysRemaining: number;
  setLicense: (data: LicenseData) => void;
  clearLicense: () => void;
  rehydrate: () => void;
  updateLastChecked: () => void;
  updateLastValidated: () => void;
}

function loadFromStorage(): LicenseData {
  try {
    const stored = localStorage.getItem("license");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return {
    licenseId: null,
    key: null,
    type: null,
    activatedAt: null,
    expiresAt: null,
    lastChecked: null,
    lastValidatedAt: null,
    maxCameras: -1,
    maxPeople: -1,
    features: [],
    signedPayload: null,
    publicKey: null,
  };
}

function saveToStorage(data: LicenseData) {
  localStorage.setItem("license", JSON.stringify(data));
}

function calculateState(data: LicenseData) {
  const isActive =
    data.expiresAt !== null && new Date(data.expiresAt) > new Date();
  const daysRemaining = data.expiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(data.expiresAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;
  return { isActive, daysRemaining };
}

export const useLicenseStore = create<LicenseState>((set, get) => {
  const initial = loadFromStorage();
  const { isActive, daysRemaining } = calculateState(initial);

  return {
    ...initial,
    isActive,
    daysRemaining,
    setLicense: (data) => {
      saveToStorage(data);
      const { isActive, daysRemaining } = calculateState(data);
      set({ ...data, isActive, daysRemaining });
    },
    clearLicense: () => {
      const empty: LicenseData = {
        licenseId: null,
        key: null,
        type: null,
        activatedAt: null,
        expiresAt: null,
        lastChecked: null,
        lastValidatedAt: null,
        maxCameras: -1,
        maxPeople: -1,
        features: [],
        signedPayload: null,
        publicKey: null,
      };
      saveToStorage(empty);
      set({ ...empty, isActive: false, daysRemaining: 0 });
    },
    rehydrate: () => {
      const fresh = loadFromStorage();
      const { isActive, daysRemaining } = calculateState(fresh);
      set({ ...fresh, isActive, daysRemaining });
    },
    updateLastChecked: () => {
      const now = new Date().toISOString();
      const current = get();
      const updated = { ...current, lastChecked: now };
      saveToStorage(updated);
      set({ lastChecked: now });
    },
    updateLastValidated: () => {
      const now = new Date().toISOString();
      const current = get();
      const updated = { ...current, lastValidatedAt: now };
      saveToStorage(updated);
      set({ lastValidatedAt: now });
    },
  };
});
