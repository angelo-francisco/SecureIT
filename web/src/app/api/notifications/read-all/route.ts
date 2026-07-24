import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    await prisma.notification.updateMany({
      where: { userId: session.sub, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Notifications READ ALL]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
