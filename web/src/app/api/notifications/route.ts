import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { notification } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const notifications = await db
			.select()
			.from(notification)
			.where(eq(notification.userId, session.sub))
			.orderBy(desc(notification.createdAt))
			.limit(50)
			.all();

		const unreadResult = await db.all<{ count: number }>(
			sql`SELECT count(*) as "count" FROM ${notification} WHERE ${eq(notification.userId, session.sub)} AND ${eq(notification.read, false)}`,
		);

		return NextResponse.json({
			notifications,
			unreadCount: unreadResult?.[0]?.count ?? 0,
		});
	} catch (error) {
		console.error("[Notifications GET]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
