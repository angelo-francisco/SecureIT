import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { verifySetupToken } from "@/lib/auth";

type SetupResult =
	| { ok: true; user: typeof user.$inferSelect }
	| { ok: false; error: string; status: number };

export async function resolveSetupUser(
	setupToken?: string,
): Promise<SetupResult> {
	if (!setupToken) {
		return {
			ok: false,
			error: "Token de configuração obrigatório",
			status: 400,
		};
	}

	const payload = await verifySetupToken(setupToken);
	if (!payload) {
		return {
			ok: false,
			error: "Sessão de configuração expirada, tente novamente",
			status: 401,
		};
	}

	const foundUser = await db
		.select()
		.from(user)
		.where(eq(user.id, payload.sub))
		.get();
	if (!foundUser) {
		return { ok: false, error: "Utilizador não encontrado", status: 404 };
	}

	return { ok: true, user: foundUser };
}
