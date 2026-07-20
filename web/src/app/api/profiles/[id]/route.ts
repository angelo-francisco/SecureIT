import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(request);
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

    const data: Record<string, unknown> = {};

    if (body.name?.trim()) data.name = body.name.trim();
    if (body.avatarColor) data.avatarColor = body.avatarColor;

    if (body.pin !== undefined) {
      if (body.pin === null || body.pin === "") {
        data.pinHash = null;
      } else if (typeof body.pin === "string" && /^\d{4}$/.test(body.pin)) {
        data.pinHash = await bcrypt.hash(body.pin, 10);
      } else {
        return NextResponse.json({ error: "O PIN deve conter 4 dígitos" }, { status: 400 });
      }
    }

    const updated = await prisma.subProfile.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      avatarColor: updated.avatarColor,
      isDefault: updated.isDefault,
      hasPin: !!updated.pinHash,
    });
  } catch (error) {
    console.error("[Profile PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(_request);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const { id } = await params;

    const profile = await prisma.subProfile.findUnique({ where: { id } });
    if (!profile || profile.userId !== session.sub) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    if (profile.isDefault) {
      return NextResponse.json({ error: "Não é possível eliminar o perfil principal" }, { status: 400 });
    }

    await prisma.subProfile.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Profile DELETE]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
