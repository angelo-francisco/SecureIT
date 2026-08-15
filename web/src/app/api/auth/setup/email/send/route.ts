import { NextResponse } from "next/server";
import {
	createEmailCodeWithCooldown,
	sendVerificationEmail,
} from "@/lib/email";
import { resolveSetupUser } from "@/lib/setup";

export async function POST(request: Request) {
	try {
		const { setup_token } = (await request.json()) as {
			setup_token?: string;
		};

		const resolved = await resolveSetupUser(setup_token);
		if (!resolved.ok) {
			return NextResponse.json(
				{ error: resolved.error },
				{ status: resolved.status },
			);
		}

		const { code, shouldSend } = await createEmailCodeWithCooldown(
			resolved.user.email,
		);
		if (shouldSend) {
			await sendVerificationEmail(resolved.user.email, code);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[Setup Email Send]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
