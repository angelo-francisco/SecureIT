import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

function getAccessSecret() {
	const secret = process.env.JWT_SECRET;
	if (!secret) throw new Error("Missing JWT_SECRET env variable");
	return new TextEncoder().encode(secret);
}

function getRefreshSecret() {
	const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
	if (!secret) throw new Error("Missing JWT_SECRET env variable");
	return new TextEncoder().encode(secret);
}

export interface TokenPayload {
	sub: string;
	email: string;
	type: "access" | "refresh";
}

export const ACCESS_MAX_AGE = 30 * 24 * 60 * 60; // 30 dias
export const REFRESH_MAX_AGE = 90 * 24 * 60 * 60; // 90 dias
export const CHALLENGE_MAX_AGE = 10 * 60; // 10 minutos
export const SETUP_MAX_AGE = 2 * 60 * 60; // 2 horas

export async function createToken(
	payload: Omit<TokenPayload, "type">,
	type: TokenPayload["type"] = "access",
): Promise<string> {
	const secret = type === "refresh" ? getRefreshSecret() : getAccessSecret();
	const expiresIn = type === "refresh" ? "90d" : "30d";

	return new SignJWT({ ...payload, type })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime(expiresIn)
		.sign(secret);
}

export async function verifyAccessToken(
	token: string,
): Promise<TokenPayload | null> {
	try {
		const { payload } = await jwtVerify(token, getAccessSecret());
		if (payload.type !== "access") return null;
		return payload as unknown as TokenPayload;
	} catch {
		return null;
	}
}

export async function verifyRefreshToken(
	token: string,
): Promise<TokenPayload | null> {
	try {
		const { payload } = await jwtVerify(token, getRefreshSecret());
		if (payload.type !== "refresh") return null;
		return payload as unknown as TokenPayload;
	} catch {
		return null;
	}
}

export interface ChallengePayload {
	sub: string;
	email: string;
	type: "challenge";
}

export async function createChallengeToken(
	sub: string,
	email: string,
): Promise<string> {
	return new SignJWT({ sub, email, type: "challenge" })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("10m")
		.sign(getAccessSecret());
}

export async function verifyChallengeToken(
	token: string,
): Promise<ChallengePayload | null> {
	try {
		const { payload } = await jwtVerify(token, getAccessSecret());
		if (payload.type !== "challenge") return null;
		return payload as unknown as ChallengePayload;
	} catch {
		return null;
	}
}

export interface SetupPayload {
	sub: string;
	email: string;
	type: "setup";
}

export async function createSetupToken(
	sub: string,
	email: string,
): Promise<string> {
	return new SignJWT({ sub, email, type: "setup" })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("2h")
		.sign(getAccessSecret());
}

export async function verifySetupToken(
	token: string,
): Promise<SetupPayload | null> {
	try {
		const { payload } = await jwtVerify(token, getAccessSecret());
		if (payload.type !== "setup") return null;
		return payload as unknown as SetupPayload;
	} catch {
		return null;
	}
}

export async function getSession(
	request?: Request,
): Promise<TokenPayload | null> {
	// Check Authorization header first (desktop/bearer)
	if (request) {
		const authHeader = request.headers.get("authorization");
		if (authHeader?.startsWith("Bearer ")) {
			const token = authHeader.slice(7);
			return verifyAccessToken(token);
		}
	}
	// Fallback to cookie (web)
	const cookieStore = await cookies();
	const token = cookieStore.get("token")?.value;
	if (!token) return null;
	return verifyAccessToken(token);
}

export async function getAdminSession(): Promise<TokenPayload | null> {
	const cookieStore = await cookies();
	const token = cookieStore.get("admin_token")?.value;
	if (!token) return null;
	return verifyAccessToken(token);
}

export function clearTokenCookies(res: NextResponse) {
	res.cookies.set("token", "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 0,
		path: "/",
	});

	res.cookies.set("refresh_token", "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 0,
		path: "/",
	});

	res.cookies.set("admin_token", "", {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 0,
		path: "/",
	});

	return res;
}

export function setTokenCookies(
	res: NextResponse,
	accessToken: string,
	refreshToken: string,
) {
	res.cookies.set("token", accessToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: ACCESS_MAX_AGE,
		path: "/",
	});

	res.cookies.set("refresh_token", refreshToken, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: REFRESH_MAX_AGE,
		path: "/",
	});

	return res;
}
