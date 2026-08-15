import { NextResponse } from "next/server";
import type { user } from "@/db/schema";
import {
	createChallengeToken,
	createSetupToken,
	createToken,
	setTokenCookies,
} from "@/lib/auth";

export type AuthUser = typeof user.$inferSelect;

export type ChallengeMethod = "totp" | "email-code";

export function requiresTwoFactorSetup(u: AuthUser) {
	return !u.emailVerified || !u.email2faEnabled || !u.totpEnabled;
}

export function buildUserPayload(u: AuthUser) {
	return {
		id: u.id,
		email: u.email,
		firstName: u.firstName,
		lastName: u.lastName,
		phone: u.phone,
		totpEnabled: u.totpEnabled,
		email2faEnabled: u.email2faEnabled,
		isActive: u.isActive,
		createdAt: u.createdAt,
	};
}

export async function issueAuthResponse(u: AuthUser) {
	const accessToken = await createToken(
		{ sub: u.id, email: u.email },
		"access",
	);
	const refreshToken = await createToken(
		{ sub: u.id, email: u.email },
		"refresh",
	);

	const baseResponse = NextResponse.json({
		access_token: accessToken,
		user: buildUserPayload(u),
	});

	return setTokenCookies(baseResponse, accessToken, refreshToken);
}

export async function issueAuthRedirect(u: AuthUser, target: string) {
	const accessToken = await createToken(
		{ sub: u.id, email: u.email },
		"access",
	);
	const refreshToken = await createToken(
		{ sub: u.id, email: u.email },
		"refresh",
	);

	const baseResponse = NextResponse.redirect(target);
	return setTokenCookies(baseResponse, accessToken, refreshToken);
}

export async function issueChallengeResponse(
	u: AuthUser,
	method: ChallengeMethod,
) {
	const challengeToken = await createChallengeToken(u.id, u.email);

	return NextResponse.json({
		challenge: method,
		challenge_token: challengeToken,
		email: u.email,
	});
}

export async function issueSetupResponse(u: AuthUser) {
	const setupToken = await createSetupToken(u.id, u.email);

	return NextResponse.json({
		requires_setup: true,
		setup_token: setupToken,
		email: u.email,
	});
}

export async function issueSetupRedirect(u: AuthUser, origin: string) {
	const setupToken = await createSetupToken(u.id, u.email);
	return NextResponse.redirect(
		new URL(`/setup?setup_token=${encodeURIComponent(setupToken)}`, origin),
	);
}
