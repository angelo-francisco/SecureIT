import { NextResponse } from "next/server";
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

		return NextResponse.json({
			email: resolved.user.email,
			emailVerified: resolved.user.emailVerified,
			email2faEnabled: resolved.user.email2faEnabled,
			totpEnabled: resolved.user.totpEnabled,
		});
	} catch (error) {
		console.error("[Setup Status]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
