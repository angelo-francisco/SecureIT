import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("@/api-client/license", () => ({
  licenseApi: {
    getFingerprint: vi.fn(),
    verifyLocal: vi.fn(),
  },
}));

import { useLicenseGuard } from "@/hooks/useLicenseGuard";
import { licenseApi } from "@/api-client/license";

const mockGetFingerprint = vi.mocked(licenseApi.getFingerprint);
const mockVerifyLocal = vi.mocked(licenseApi.verifyLocal);

describe("useLicenseGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns loading status initially", () => {
    mockGetFingerprint.mockReturnValue(new Promise(() => {}));
    mockVerifyLocal.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useLicenseGuard("user-1"));
    expect(result.current.status).toBe("loading");
  });

  it("returns valid when verifyLocal returns valid=true", async () => {
    mockGetFingerprint.mockResolvedValue({ fingerprint: "fp-123" });
    mockVerifyLocal.mockResolvedValue({
      valid: true,
      license_id: "lic-1",
      license_key: "KEY-1",
      license_type: "STANDARD",
      activated_at: "2025-01-01T00:00:00Z",
      expires_at: "2026-12-31T23:59:59Z",
      last_validated_at: null,
      max_cameras: 5,
      max_people: 10,
      features: [],
      status: "active",
      days_remaining: 365,
      reason: null,
    });

    const { result } = renderHook(() => useLicenseGuard("user-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("valid");
    });

    expect(result.current.licenseInfo).toBeTruthy();
    expect(result.current.licenseInfo.valid).toBe(true);
  });

  it("returns no_license when reason=no_license", async () => {
    mockGetFingerprint.mockResolvedValue({ fingerprint: "fp-123" });
    mockVerifyLocal.mockResolvedValue({
      valid: false,
      license_id: null,
      license_key: null,
      license_type: null,
      activated_at: null,
      expires_at: null,
      last_validated_at: null,
      max_cameras: 0,
      max_people: 0,
      features: [],
      status: "no_license",
      days_remaining: 0,
      reason: "no_license",
    });

    const { result } = renderHook(() => useLicenseGuard("user-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("no_license");
    });
  });

  it("returns revoked when reason=revoked", async () => {
    mockGetFingerprint.mockResolvedValue({ fingerprint: "fp-123" });
    mockVerifyLocal.mockResolvedValue({
      valid: false,
      license_id: "lic-1",
      license_key: "KEY-1",
      license_type: "STANDARD",
      activated_at: "2025-01-01T00:00:00Z",
      expires_at: "2026-12-31T23:59:59Z",
      last_validated_at: "2025-06-01T00:00:00Z",
      max_cameras: 5,
      max_people: 10,
      features: [],
      status: "revoked",
      days_remaining: 0,
      reason: "revoked",
    });

    const { result } = renderHook(() => useLicenseGuard("user-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("revoked");
    });
  });

  it("returns fingerprint_mismatch when reason=fingerprint_mismatch", async () => {
    mockGetFingerprint.mockResolvedValue({ fingerprint: "fp-123" });
    mockVerifyLocal.mockResolvedValue({
      valid: false,
      license_id: "lic-1",
      license_key: "KEY-1",
      license_type: "STANDARD",
      activated_at: "2025-01-01T00:00:00Z",
      expires_at: "2026-12-31T23:59:59Z",
      last_validated_at: null,
      max_cameras: 5,
      max_people: 10,
      features: [],
      status: "fingerprint_mismatch",
      days_remaining: 0,
      reason: "fingerprint_mismatch",
    });

    const { result } = renderHook(() => useLicenseGuard("user-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("fingerprint_mismatch");
    });
  });

  it("returns error on network failure", async () => {
    mockGetFingerprint.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useLicenseGuard("user-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
  });

  it("returns no_license when userId is null", async () => {
    const { result } = renderHook(() => useLicenseGuard(null));

    await waitFor(() => {
      expect(result.current.status).toBe("no_license");
    });

    expect(mockGetFingerprint).not.toHaveBeenCalled();
    expect(mockVerifyLocal).not.toHaveBeenCalled();
  });

  it("returns stale when reason=stale", async () => {
    mockGetFingerprint.mockResolvedValue({ fingerprint: "fp-123" });
    mockVerifyLocal.mockResolvedValue({
      valid: false,
      license_id: "lic-1",
      license_key: "KEY-1",
      license_type: "STANDARD",
      activated_at: "2025-01-01T00:00:00Z",
      expires_at: "2026-12-31T23:59:59Z",
      last_validated_at: "2025-01-01T00:00:00Z",
      max_cameras: 5,
      max_people: 10,
      features: [],
      status: "stale",
      days_remaining: 365,
      reason: "stale",
    });

    const { result } = renderHook(() => useLicenseGuard("user-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("stale");
    });
  });

  it("returns expired when reason=expired", async () => {
    mockGetFingerprint.mockResolvedValue({ fingerprint: "fp-123" });
    mockVerifyLocal.mockResolvedValue({
      valid: false,
      license_id: "lic-1",
      license_key: "KEY-1",
      license_type: "TRIAL",
      activated_at: "2024-01-01T00:00:00Z",
      expires_at: "2024-12-31T23:59:59Z",
      last_validated_at: null,
      max_cameras: 2,
      max_people: 5,
      features: [],
      status: "expired",
      days_remaining: 0,
      reason: "expired",
    });

    const { result } = renderHook(() => useLicenseGuard("user-1"));

    await waitFor(() => {
      expect(result.current.status).toBe("expired");
    });
  });
});
