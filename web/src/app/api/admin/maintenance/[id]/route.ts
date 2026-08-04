import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { maintenanceRequest } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getAdminSession();
	if (!session)
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	const { id } = await params;
	try {
		const body = (await request.json()) as {
			status?: string;
			adminNote?: string;
		};
		const { status, adminNote } = body;

		const updates: Record<string, unknown> = {};
		if (status !== undefined) updates.status = status;
		if (adminNote !== undefined) updates.adminNote = adminNote;

		const updated = await db
			.update(maintenanceRequest)
			.set(updates)
			.where(eq(maintenanceRequest.id, id))
			.returning()
			.get();
		return NextResponse.json(updated);
	} catch (error) {
		console.error("[Admin Maintenance PUT]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
