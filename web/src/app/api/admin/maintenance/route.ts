import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  try {
    const requests = await prisma.maintenanceRequest.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("[Admin Maintenance GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
