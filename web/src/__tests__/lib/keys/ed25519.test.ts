import { describe, it, expect, beforeAll } from "vitest";
import {
  signLicensePayload,
  verifyLicensePayload,
} from "@/lib/keys/ed25519";

beforeAll(() => {
  if (!process.env.ED25519_PRIVATE_KEY) {
    process.env.ED25519_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEII9EDpsa1ONU5hnBuipqXwKIfj4BGW/aLQS4b4LyPWuE
-----END PRIVATE KEY-----`;
  }
  if (!process.env.ED25519_PUBLIC_KEY) {
    process.env.ED25519_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAHrtEND2DcZ62fPtiBqDbvNqoqoaJbwcxW4+WFHsB9Xg=
-----END PUBLIC KEY-----`;
  }
});

describe("lib/keys/ed25519", () => {
  const payload = {
    key: "SEC-TEST-1234-ABCD-5678",
    type: "STANDARD",
    userId: "test-user-id",
    email: "test@example.com",
    maxCameras: -1,
    maxPeople: -1,
    features: ["face_recognition"],
  };

  it("signLicensePayload returns a JWT string with 3 parts", async () => {
    const token = await signLicensePayload(payload);
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });

  it("sign+verify roundtrip returns same payload", async () => {
    const token = await signLicensePayload(payload);
    const verified = await verifyLicensePayload(token);
    expect(verified).not.toBeNull();
    expect(verified!.key).toBe(payload.key);
    expect(verified!.type).toBe(payload.type);
    expect(verified!.userId).toBe(payload.userId);
    expect(verified!.email).toBe(payload.email);
  });

  it("verifyLicensePayload with tampered payload returns null", async () => {
    const token = await signLicensePayload(payload);
    const parts = token.split(".");
    const header = parts[0];
    const payloadObj = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    payloadObj.email = "hacked@evil.com";
    const tamperedPayload = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
    const tamperedToken = `${header}.${tamperedPayload}.${parts[2]}`;
    const result = await verifyLicensePayload(tamperedToken);
    expect(result).toBeNull();
  });

  it("JWT has correct header (alg=EdDSA, kid=secureit-license-v1)", async () => {
    const token = await signLicensePayload(payload);
    const header = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
    expect(header.alg).toBe("EdDSA");
    expect(header.kid).toBe("secureit-license-v1");
  });

  it("JWT has iss=secureit-web in payload", async () => {
    const token = await signLicensePayload(payload);
    const payloadBase64 = token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payloadBase64, "base64url").toString());
    expect(decoded.iss).toBe("secureit-web");
  });
});
