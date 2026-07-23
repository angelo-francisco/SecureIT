import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@/stores/license", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/stores/license")>();
  return {
    ...actual,
    useLicenseStore: actual.useLicenseStore,
  };
});

import { useLicenseStore } from "@/stores/license";
import { useLicense } from "@/hooks/useLicense";

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

describe("useLicense", () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  it("hasLicense is true when licenseId is set", () => {
    useLicenseStore.setState({ licenseId: "lic-123" });
    const { result } = renderHook(() => useLicense());
    expect(result.current.hasLicense).toBe(true);
  });

  it("hasLicense is false when licenseId is null", () => {
    useLicenseStore.setState({ licenseId: null });
    const { result } = renderHook(() => useLicense());
    expect(result.current.hasLicense).toBe(false);
  });

  it("isTrial is true when type is TRIAL", () => {
    useLicenseStore.setState({ type: "TRIAL" });
    const { result } = renderHook(() => useLicense());
    expect(result.current.isTrial).toBe(true);
    expect(result.current.isStandard).toBe(false);
  });

  it("isStandard is true when type is STANDARD", () => {
    useLicenseStore.setState({ type: "STANDARD" });
    const { result } = renderHook(() => useLicense());
    expect(result.current.isStandard).toBe(true);
    expect(result.current.isTrial).toBe(false);
  });

  it("maxCameras becomes Infinity when store value is -1", () => {
    useLicenseStore.setState({ maxCameras: -1 });
    const { result } = renderHook(() => useLicense());
    expect(result.current.maxCameras).toBe(Infinity);
  });

  it("maxCameras stays as number when > 0", () => {
    useLicenseStore.setState({ maxCameras: 5 });
    const { result } = renderHook(() => useLicense());
    expect(result.current.maxCameras).toBe(5);
  });

  it("maxPeople becomes Infinity when store value is -1", () => {
    useLicenseStore.setState({ maxPeople: -1 });
    const { result } = renderHook(() => useLicense());
    expect(result.current.maxPeople).toBe(Infinity);
  });

  it("maxPeople stays as number when > 0", () => {
    useLicenseStore.setState({ maxPeople: 10 });
    const { result } = renderHook(() => useLicense());
    expect(result.current.maxPeople).toBe(10);
  });

  it("canAddCamera returns true when currentCount < maxCameras", () => {
    useLicenseStore.setState({ maxCameras: 5 });
    const { result } = renderHook(() => useLicense());
    expect(result.current.canAddCamera(3)).toBe(true);
  });

  it("canAddCamera returns false when currentCount >= maxCameras", () => {
    useLicenseStore.setState({ maxCameras: 5 });
    const { result } = renderHook(() => useLicense());
    expect(result.current.canAddCamera(5)).toBe(false);
    expect(result.current.canAddCamera(6)).toBe(false);
  });

  it("canAddCamera returns true when maxCameras is Infinity", () => {
    useLicenseStore.setState({ maxCameras: -1 });
    const { result } = renderHook(() => useLicense());
    expect(result.current.canAddCamera(1000)).toBe(true);
  });

  it("canAddPerson returns true when currentCount < maxPeople", () => {
    useLicenseStore.setState({ maxPeople: 10 });
    const { result } = renderHook(() => useLicense());
    expect(result.current.canAddPerson(5)).toBe(true);
  });

  it("canAddPerson returns false when currentCount >= maxPeople", () => {
    useLicenseStore.setState({ maxPeople: 10 });
    const { result } = renderHook(() => useLicense());
    expect(result.current.canAddPerson(10)).toBe(false);
    expect(result.current.canAddPerson(11)).toBe(false);
  });

  it("canAddPerson returns true when maxPeople is Infinity", () => {
    useLicenseStore.setState({ maxPeople: -1 });
    const { result } = renderHook(() => useLicense());
    expect(result.current.canAddPerson(10000)).toBe(true);
  });

  it("faceRecognition is true when features includes face_recognition", () => {
    useLicenseStore.setState({ features: ["face_recognition", "other"] });
    const { result } = renderHook(() => useLicense());
    expect(result.current.faceRecognition).toBe(true);
  });

  it("faceRecognition is false when features does not include face_recognition", () => {
    useLicenseStore.setState({ features: ["other_feature"] });
    const { result } = renderHook(() => useLicense());
    expect(result.current.faceRecognition).toBe(false);
  });

  it("faceRecognition is false when features is empty", () => {
    useLicenseStore.setState({ features: [] });
    const { result } = renderHook(() => useLicense());
    expect(result.current.faceRecognition).toBe(false);
  });
});
