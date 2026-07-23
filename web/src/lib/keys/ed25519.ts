import { SignJWT, jwtVerify, importPKCS8, importSPKI } from "jose";
import { readFileSync } from "fs";
import { join } from "path";

const ALG = "EdDSA";
const CURVE = "Ed25519";

let cachedPrivateKey: CryptoKey | null = null;
let cachedPublicKey: CryptoKey | null = null;

function getPrivateKeyPem(): string {
  const keyPath = process.env.ED25519_PRIVATE_KEY_PATH;
  if (!keyPath) {
    throw new Error("ED25519_PRIVATE_KEY_PATH env variable is not set");
  }

  const resolved = keyPath.startsWith("/")
    ? keyPath
    : join(process.cwd(), keyPath);

  return readFileSync(resolved, "utf-8").trim();
}

function getPublicKeyPem(): string {
  const keyPath = process.env.ED25519_PUBLIC_KEY_PATH;
  if (!keyPath) {
    throw new Error("ED25519_PUBLIC_KEY_PATH env variable is not set");
  }

  const resolved = keyPath.startsWith("/")
    ? keyPath
    : join(process.cwd(), keyPath);

  return readFileSync(resolved, "utf-8").trim();
}

export async function getSigningKey(): Promise<CryptoKey> {
  if (cachedPrivateKey) return cachedPrivateKey;
  const pem = getPrivateKeyPem();
  cachedPrivateKey = await importPKCS8(pem, ALG);
  return cachedPrivateKey;
}

export async function getVerificationKey(): Promise<CryptoKey> {
  if (cachedPublicKey) return cachedPublicKey;
  const pem = getPublicKeyPem();
  cachedPublicKey = await importSPKI(pem, ALG);
  return cachedPublicKey;
}

export async function signLicensePayload(
  payload: Record<string, unknown>
): Promise<string> {
  const key = await getSigningKey();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: ALG, kid: "secureit-license-v1" })
    .setIssuedAt()
    .setIssuer("secureit-web")
    .sign(key);
  return token;
}

export async function verifyLicensePayload(
  token: string
): Promise<Record<string, unknown> | null> {
  try {
    const key = await getVerificationKey();
    const { payload } = await jwtVerify(token, key, {
      issuer: "secureit-web",
    });
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function getPublicKeyPemString(): Promise<string> {
  return getPublicKeyPem();
}
