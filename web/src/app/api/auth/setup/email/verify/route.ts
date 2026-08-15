import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { verifyEmailCode } from "@/lib/email";
import { issueAuthResponse, requiresTwoFactorSetup } from "@/lib/session";
import { resolveSetupUser } from "@/lib/setup";

export async function POST(request: Request) {
	try {
		const { setup_token, code } = (await request.json()) as {
			setup_token?: string;
			code?: string;
		};

		if (!code) {
			return NextResponse.json(
				{ error: "Código obrigatório" },
				{ status: 400 },
			);
		}

		const resolved = await resolveSetupUser(setup_token);
		if (!resolved.ok) {
			return NextResponse.json(
				{ error: resolved.error },
				{ status: resolved.status },
			);
		}

		if (resolved.user.emailVerified) {
			if (!requiresTwoFactorSetup(resolved.user)) {
				return await issueAuthResponse(resolved.user);
			}
			return NextResponse.json({ success: true });
		}

		const valid = await verifyEmailCode(resolved.user.email, code);
		if (!valid) {
			return NextResponse.json(
				{ error: "Código inválido ou expirado" },
				{ status: 401 },
			);
		}

		const updated = {
			...resolved.user,
			emailVerified: true,
			email2faEnabled: true,
		};

		await db
			.update(user)
			.set({ emailVerified: true, email2faEnabled: true })
			.where(eq(user.id, resolved.user.id))
			.run();

		if (!requiresTwoFactorSetup(updated)) {
			return await issueAuthResponse(updated);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[Setup Email Verify]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
