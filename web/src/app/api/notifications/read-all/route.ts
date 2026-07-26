import { db } from "@/db";
import { notification } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT() {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		await db
			.update(notification)
			.set({ read: true })
			.where(
				and(eq(notification.userId, session.sub), eq(notification.read, false)),
			)
			.run();
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[Notifications READ ALL]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
