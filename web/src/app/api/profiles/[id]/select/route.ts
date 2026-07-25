import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(
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
    const { pin } = body;

    const profile = await prisma.subProfile.findUnique({ where: { id } });
    if (!profile || profile.userId !== session.sub) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    if (profile.pinHash) {
      if (!pin || typeof pin !== "string") {
        return NextResponse.json({ error: "PIN obrigatório" }, { status: 400 });
      }
      const valid = await Bun.password.verify(pin, profile.pinHash);
      if (!valid) {
        return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
      }
    }

    return NextResponse.json({
      id: profile.id,
      name: profile.name,
      avatarColor: profile.avatarColor,
      isDefault: profile.isDefault,
    });
  } catch (error) {
    console.error("[Profile Select]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
