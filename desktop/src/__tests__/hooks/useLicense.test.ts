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

  it("isB2C is true when type is B2C", () => {
    useLicenseStore.setState({ type: "B2C" });
    const { result } = renderHook(() => useLicense());
    expect(result.current.isB2C).toBe(true);
    expect(result.current.isB2B).toBe(false);
  });

  it("isB2B is true when type is B2B", () => {
    useLicenseStore.setState({ type: "B2B" });
    const { result } = renderHook(() => useLicense());
    expect(result.current.isB2B).toBe(true);
    expect(result.current.isB2C).toBe(false);
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

  it("hasFeature returns true when features includes the slug", () => {
    useLicenseStore.setState({ features: ["face_recognition", "other"] });
    const { result } = renderHook(() => useLicense());
    expect(result.current.hasFeature("face_recognition")).toBe(true);
    expect(result.current.hasFeature("other")).toBe(true);
  });

  it("hasFeature returns false when features does not include the slug", () => {
    useLicenseStore.setState({ features: ["other_feature"] });
    const { result } = renderHook(() => useLicense());
    expect(result.current.hasFeature("face_recognition")).toBe(false);
  });

  it("hasFeature returns false when features is empty", () => {
    useLicenseStore.setState({ features: [] });
    const { result } = renderHook(() => useLicense());
    expect(result.current.hasFeature("face_recognition")).toBe(false);
  });

  it("hasFeature checks multiple slugs", () => {
    useLicenseStore.setState({ features: ["anlise_comportamental"] });
    const { result } = renderHook(() => useLicense());
    expect(result.current.hasFeature("analise_comportamental", "anlise_comportamental")).toBe(true);
    expect(result.current.hasFeature("face_recognition", "other")).toBe(false);
  });
});
