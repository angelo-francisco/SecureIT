import { Auth, raw, skipCSRFCheck } from "@auth/core";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/next-auth";

export async function GET(request: Request) {
	const origin = new URL(request.url).origin;

	if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
		return NextResponse.redirect(
			new URL("/login?error=google_not_configured", origin),
		);
	}

	const signInURL = new URL("/api/auth/signin/google", origin);
	const headers = new Headers(request.headers);
	headers.set("Content-Type", "application/x-www-form-urlencoded");

	const req = new Request(signInURL, {
		method: "POST",
		headers,
		body: new URLSearchParams({ callbackUrl: "/api/auth/google/bridge" }),
	});

	const res = await Auth(req, { ...authConfig, raw, skipCSRFCheck });

	if (!res.redirect) {
		return NextResponse.redirect(new URL("/login?error=google_failed", origin));
	}

	const response = NextResponse.redirect(res.redirect);
	for (const cookie of res.cookies ?? []) {
		response.cookies.set(cookie.name, cookie.value, cookie.options);
	}
	return response;
}
