import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "x4$n!bnme4(khao6sy@8t*x&d1jn@#xk4^*u41-v20=5(2c55-"
);

export interface TokenPayload {
  sub: string;
  email: string;
  type: "access" | "refresh";
}

export async function createToken(
  payload: Omit<TokenPayload, "type">,
  type: TokenPayload["type"] = "access"
): Promise<string> {
  const expiresIn = type === "access" ? "365d" : "7d";

  return new SignJWT({ ...payload, type })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
