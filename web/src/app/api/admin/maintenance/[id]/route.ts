import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await params;
  try {
    const body = (await request.json()) as any;
    const { status, adminNote } = body;

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(adminNote !== undefined && { adminNote }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Admin Maintenance PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
