import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session.sub, read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("[Notifications GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
