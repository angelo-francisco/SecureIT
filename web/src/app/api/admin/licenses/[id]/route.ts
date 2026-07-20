import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const license = await prisma.licenseKey.findUnique({
      where: { id },
      include: {
        license: {
          include: { user: { select: { email: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!license) {
      return NextResponse.json(
        { error: "Licença não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(license);
  } catch (error) {
    console.error("[Admin Get License]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const license = await prisma.licenseKey.findUnique({ where: { id } });

    if (!license) {
      return NextResponse.json(
        { error: "Licença não encontrada" },
        { status: 404 }
      );
    }

    await prisma.licenseKey.update({
      where: { id },
      data: { status: "REVOKED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Revoke License]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
