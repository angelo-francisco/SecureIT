import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { licenseApi } from "@/api-client/license";

const WEB_BASE = (
  import.meta.env.VITE_WEB_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");
const API_BASE = "http://localhost:8000";

describe("licenseApi", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockOk(body: unknown) {
    return {
      ok: true,
      status: 200,
      json: () => Promise.resolve(body),
    } as Response;
  }

  function mockError(status: number, body: unknown) {
    return {
      ok: false,
      status,
      json: () => Promise.resolve(body),
    } as Response;
  }

  it("activate calls correct URL and method", async () => {
    fetchSpy.mockResolvedValue(mockOk({ valid: true, licenseId: "lic-1" }));

    await licenseApi.activate({ key: "KEY-123", email: "test@example.com" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${WEB_BASE}/api/licenses/activate`);
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({
      key: "KEY-123",
      email: "test@example.com",
    });
  });

  it("heartbeat calls correct URL and method", async () => {
    fetchSpy.mockResolvedValue(mockOk({ valid: true, isActive: true }));

    await licenseApi.heartbeat({ licenseId: "lic-1" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${WEB_BASE}/api/licenses/heartbeat`);
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({ licenseId: "lic-1" });
  });

  it("getFingerprint calls correct URL", async () => {
    fetchSpy.mockResolvedValue(mockOk({ fingerprint: "fp-abc" }));

    const result = await licenseApi.getFingerprint();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/license/fingerprint`);
    expect(opts.method).toBeUndefined();
    expect(result).toEqual({ fingerprint: "fp-abc" });
  });

  it("storeLocal calls correct URL with correct body", async () => {
    fetchSpy.mockResolvedValue(mockOk({ success: true, license_id: "lic-1" }));

    await licenseApi.storeLocal({
      license_id: "lic-1",
      user_id: "user-1",
      license_key: "KEY-1",
      license_type: "B2C",
      activated_at: "2025-01-01T00:00:00Z",
      expires_at: "2026-01-01T00:00:00Z",
      hardware_fingerprint: "fp-123",
      signed_payload: "sig",
      public_key: "pub",
      signature: "signed",
      max_cameras: 5,
      max_people: 10,
      features: [],
      status: "active",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/license/store`);
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body);
    expect(body.license_id).toBe("lic-1");
    expect(body.user_id).toBe("user-1");
    expect(body.hardware_fingerprint).toBe("fp-123");
  });

  it("verifyLocal calls correct URL", async () => {
    fetchSpy.mockResolvedValue(mockOk({ valid: true, license_id: "lic-1", reason: null }));

    await licenseApi.verifyLocal({ user_id: "user-1", hardware_fingerprint: "fp-123" });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/license/verify`);
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({
      user_id: "user-1",
      hardware_fingerprint: "fp-123",
    });
  });

  it("getCurrent calls correct URL with query param", async () => {
    fetchSpy.mockResolvedValue(mockOk({ exists: true, license_id: "lic-1" }));

    await licenseApi.getCurrent("user-1");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/license/current?user_id=user-1`);
    expect(opts.method).toBeUndefined();
  });

  it("getCurrent encodes user ID in query param", async () => {
    fetchSpy.mockResolvedValue(mockOk({ exists: false }));

    await licenseApi.getCurrent("user with spaces");

    const [url] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/license/current?user_id=user%20with%20spaces`);
  });

  it("clearLocal calls correct URL", async () => {
    fetchSpy.mockResolvedValue(mockOk({ success: true, deleted: true }));

    await licenseApi.clearLocal("user-1");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/license/clear`);
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({ user_id: "user-1" });
  });

  it("checkFeatures calls correct URL", async () => {
    fetchSpy.mockResolvedValue(mockOk({
      allowed: true,
      reason: null,
      max_cameras: 5,
      max_people: 10,
      features: ["face_recognition"],
    }));

    await licenseApi.checkFeatures("user-1");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchSpy.mock.calls[0];
    expect(url).toBe(`${API_BASE}/api/license/features`);
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body)).toEqual({ user_id: "user-1" });
  });

  it("error handling throws on non-ok response from webFetch", async () => {
    fetchSpy.mockResolvedValue(mockError(400, { error: "Invalid key" }));

    await expect(
      licenseApi.activate({ key: "BAD", email: "test@example.com" })
    ).rejects.toThrow("Invalid key");
  });

  it("error handling throws on non-ok response from apiFetch", async () => {
    fetchSpy.mockResolvedValue(mockError(404, { detail: "Not found" }));

    await expect(
      licenseApi.verifyLocal({ user_id: "user-1", hardware_fingerprint: "fp" })
    ).rejects.toThrow("Not found");
  });

  it("error handling uses default message when no error/detail field", async () => {
    fetchSpy.mockResolvedValue(mockError(500, {}));

    await expect(
      licenseApi.activate({ key: "KEY", email: "test@example.com" })
    ).rejects.toThrow("Erro na requisição");
  });
});
