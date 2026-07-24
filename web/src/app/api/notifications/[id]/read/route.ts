import { prisma } from "@/lib/prisma";
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
    const notification = await prisma.notification.updateMany({
      where: { id, userId: session.sub },
      data: { read: true },
    });
    return NextResponse.json({ updated: notification.count });
  } catch (error) {
    console.error("[Notification READ]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
