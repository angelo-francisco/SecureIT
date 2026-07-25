import { db } from "@/db";
import { notification } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const result = await db
      .update(notification)
      .set({ read: true })
      .where(and(eq(notification.id, id), eq(notification.userId, session.sub)))
      .run();

    return NextResponse.json({ updated: true });
  } catch (error) {
    console.error("[Notification READ]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
