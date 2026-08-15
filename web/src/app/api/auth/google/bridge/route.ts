import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/next-auth";
import { hashPassword } from "@/lib/password";
import { issueAuthRedirect, issueSetupRedirect } from "@/lib/session";

export async function GET(request: Request) {
	const origin = new URL(request.url).origin;
	const session = await auth();

	if (!session?.user?.email) {
		return NextResponse.redirect(new URL("/login?error=google_failed", origin));
	}

	const { email, name, googleId, googleEmailVerified } = session.user;
	if (!email || googleEmailVerified === false) {
		return NextResponse.redirect(
			new URL(
				`/login?error=${encodeURIComponent("google_email_not_verified")}`,
				origin,
			),
		);
	}

	let foundUser = await db
		.select()
		.from(user)
		.where(eq(user.email, email))
		.get();

	if (!foundUser) {
		const [first, ...rest] = (name ?? "").trim().split(/\s+/);
		const passwordHash = await hashPassword(
			randomBytes(24).toString("base64url"),
		);
		[foundUser] = await db
			.insert(user)
			.values({
				email,
				passwordHash,
				googleId,
				firstName: first || "Utilizador",
				lastName: rest.join(" ") || "Google",
				emailVerified: true,
				email2faEnabled: true,
			})
			.returning()
			.all();
	} else {
		if (!foundUser.isActive) {
			return NextResponse.redirect(
				new URL("/login?error=account_disabled", origin),
			);
		}
		if (!foundUser.googleId && googleId) {
			await db
				.update(user)
				.set({ googleId })
				.where(eq(user.id, foundUser.id))
				.run();
			foundUser = { ...foundUser, googleId };
		}
		if (!foundUser.emailVerified || !foundUser.email2faEnabled) {
			await db
				.update(user)
				.set({ emailVerified: true, email2faEnabled: true })
				.where(eq(user.id, foundUser.id))
				.run();
			foundUser = { ...foundUser, emailVerified: true, email2faEnabled: true };
		}
	}

	if (!foundUser.totpEnabled) {
		return await issueSetupRedirect(foundUser, origin);
	}

	return await issueAuthRedirect(foundUser, `${origin}/my-account`);
}
