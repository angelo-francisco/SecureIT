import { describe, it, expect, vi, beforeEach } from "vitest";

import { useLicenseStore } from "@/stores/license";

function resetStore() {
  useLicenseStore.setState({
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
    isActive: false,
    daysRemaining: 0,
  });
}

describe("useLicenseStore", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  it("has default values with isActive false and daysRemaining 0", () => {
    const state = useLicenseStore.getState();
    expect(state.licenseId).toBeNull();
    expect(state.isActive).toBe(false);
    expect(state.daysRemaining).toBe(0);
    expect(state.maxCameras).toBe(-1);
    expect(state.maxPeople).toBe(-1);
    expect(state.features).toEqual([]);
  });

  it("setLicense stores data and updates isActive/daysRemaining", () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    useLicenseStore.getState().setLicense({
      licenseId: "lic-123",
      key: "KEY-AAAA",
      type: "STANDARD",
      activatedAt: new Date().toISOString(),
      expiresAt: futureDate,
      lastChecked: null,
      lastValidatedAt: null,
      maxCameras: 5,
      maxPeople: 10,
      features: ["face_recognition"],
      signedPayload: "sig",
      publicKey: "pub",
    });

    const state = useLicenseStore.getState();
    expect(state.licenseId).toBe("lic-123");
    expect(state.key).toBe("KEY-AAAA");
    expect(state.type).toBe("STANDARD");
    expect(state.isActive).toBe(true);
    expect(state.daysRemaining).toBeGreaterThanOrEqual(9);
    expect(state.maxCameras).toBe(5);
    expect(state.maxPeople).toBe(10);
    expect(state.features).toEqual(["face_recognition"]);
  });

  it("setLicense marks inactive when expired", () => {
    const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

    useLicenseStore.getState().setLicense({
      licenseId: "lic-expired",
      key: "KEY-EXPIRED",
      type: "TRIAL",
      activatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: pastDate,
      lastChecked: null,
      lastValidatedAt: null,
      maxCameras: 2,
      maxPeople: 5,
      features: [],
      signedPayload: "sig",
      publicKey: "pub",
    });

    const state = useLicenseStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.daysRemaining).toBe(0);
  });

  it("clearLicense resets everything to defaults", () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    useLicenseStore.getState().setLicense({
      licenseId: "lic-123",
      key: "KEY-AAAA",
      type: "STANDARD",
      activatedAt: new Date().toISOString(),
      expiresAt: futureDate,
      lastChecked: null,
      lastValidatedAt: null,
      maxCameras: 5,
      maxPeople: 10,
      features: ["face_recognition"],
      signedPayload: "sig",
      publicKey: "pub",
    });

    useLicenseStore.getState().clearLicense();

    const state = useLicenseStore.getState();
    expect(state.licenseId).toBeNull();
    expect(state.key).toBeNull();
    expect(state.type).toBeNull();
    expect(state.expiresAt).toBeNull();
    expect(state.isActive).toBe(false);
    expect(state.daysRemaining).toBe(0);
    expect(state.maxCameras).toBe(-1);
    expect(state.maxPeople).toBe(-1);
    expect(state.features).toEqual([]);
  });

  it("updateLastChecked sets timestamp", () => {
    const before = Date.now();
    useLicenseStore.getState().updateLastChecked();
    const after = Date.now();

    const state = useLicenseStore.getState();
    expect(state.lastChecked).not.toBeNull();
    const checkedTime = new Date(state.lastChecked!).getTime();
    expect(checkedTime).toBeGreaterThanOrEqual(before);
    expect(checkedTime).toBeLessThanOrEqual(after);
  });

  it("updateLastValidated sets timestamp", () => {
    const before = Date.now();
    useLicenseStore.getState().updateLastValidated();
    const after = Date.now();

    const state = useLicenseStore.getState();
    expect(state.lastValidatedAt).not.toBeNull();
    const validatedTime = new Date(state.lastValidatedAt!).getTime();
    expect(validatedTime).toBeGreaterThanOrEqual(before);
    expect(validatedTime).toBeLessThanOrEqual(after);
  });

  it("persists to localStorage on setLicense", () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    useLicenseStore.getState().setLicense({
      licenseId: "lic-persist",
      key: "KEY-PERSIST",
      type: "TRIAL",
      activatedAt: new Date().toISOString(),
      expiresAt: futureDate,
      lastChecked: null,
      lastValidatedAt: null,
      maxCameras: 3,
      maxPeople: 7,
      features: [],
      signedPayload: "sig",
      publicKey: "pub",
    });

    const stored = localStorage.getItem("license");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.licenseId).toBe("lic-persist");
    expect(parsed.key).toBe("KEY-PERSIST");
    expect(parsed.type).toBe("TRIAL");
  });

  it("persists to localStorage on clearLicense", () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    useLicenseStore.getState().setLicense({
      licenseId: "lic-to-clear",
      key: "KEY-CLEAR",
      type: "STANDARD",
      activatedAt: new Date().toISOString(),
      expiresAt: futureDate,
      lastChecked: null,
      lastValidatedAt: null,
      maxCameras: 5,
      maxPeople: 10,
      features: [],
      signedPayload: "sig",
      publicKey: "pub",
    });

    useLicenseStore.getState().clearLicense();

    const stored = localStorage.getItem("license");
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.licenseId).toBeNull();
    expect(parsed.maxCameras).toBe(-1);
  });

  it("loads from localStorage on init", async () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    const data = {
      licenseId: "lic-stored",
      key: "KEY-STORED",
      type: "STANDARD",
      activatedAt: new Date().toISOString(),
      expiresAt: futureDate,
      lastChecked: null,
      lastValidatedAt: null,
      maxCameras: 4,
      maxPeople: 8,
      features: ["face_recognition"],
      signedPayload: "sig",
      publicKey: "pub",
    };

    localStorage.setItem("license", JSON.stringify(data));

    vi.resetModules();
    const { useLicenseStore: freshStore } = await import("@/stores/license");
    const state = freshStore.getState();
    expect(state.licenseId).toBe("lic-stored");
    expect(state.maxCameras).toBe(4);
    expect(state.features).toEqual(["face_recognition"]);
  });

  it("maxCameras and maxPeople default to -1", () => {
    const state = useLicenseStore.getState();
    expect(state.maxCameras).toBe(-1);
    expect(state.maxPeople).toBe(-1);
  });

  it("calculateState: daysRemaining is 0 when no expiresAt", () => {
    useLicenseStore.getState().setLicense({
      licenseId: "lic-no-exp",
      key: "KEY-NO-EXP",
      type: "TRIAL",
      activatedAt: new Date().toISOString(),
      expiresAt: null,
      lastChecked: null,
      lastValidatedAt: null,
      maxCameras: -1,
      maxPeople: -1,
      features: [],
      signedPayload: "sig",
      publicKey: "pub",
    });

    const state = useLicenseStore.getState();
    expect(state.isActive).toBe(false);
    expect(state.daysRemaining).toBe(0);
  });

  it("calculateState: daysRemaining is floored at 0 for expired license", () => {
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    useLicenseStore.getState().setLicense({
      licenseId: "lic-past",
      key: "KEY-PAST",
      type: "TRIAL",
      activatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: pastDate,
      lastChecked: null,
      lastValidatedAt: null,
      maxCameras: -1,
      maxPeople: -1,
      features: [],
      signedPayload: "sig",
      publicKey: "pub",
    });

    const state = useLicenseStore.getState();
    expect(state.daysRemaining).toBe(0);
  });
});
