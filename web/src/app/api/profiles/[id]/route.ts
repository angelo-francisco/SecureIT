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
    const body = await request.json();

    const profile = await prisma.subProfile.findUnique({ where: { id } });
    if (!profile || profile.userId !== session.sub) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    const updated = await prisma.subProfile.update({
      where: { id },
      data: {
        name: body.name?.trim() || profile.name,
        avatarColor: body.avatarColor || profile.avatarColor,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Profile PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const { id } = await params;

    const profile = await prisma.subProfile.findUnique({ where: { id } });
    if (!profile || profile.userId !== session.sub) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    await prisma.subProfile.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Profile DELETE]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
