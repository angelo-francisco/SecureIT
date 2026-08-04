import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { notification } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function PUT(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const { id } = await params;
		const _result = await db
			.update(notification)
			.set({ read: true })
			.where(and(eq(notification.id, id), eq(notification.userId, session.sub)))
			.run();

		return NextResponse.json({ updated: true });
	} catch (error) {
		console.error("[Notification READ]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
