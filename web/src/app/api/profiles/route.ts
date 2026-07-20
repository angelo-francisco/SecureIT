import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const profiles = await prisma.subProfile.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(profiles);
  } catch (error) {
    console.error("[Profiles GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { name, avatarColor } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    const count = await prisma.subProfile.count({
      where: { userId: session.sub },
    });
    if (count >= 5) {
      return NextResponse.json({ error: "Máximo de 5 sub-perfis" }, { status: 400 });
    }

    const profile = await prisma.subProfile.create({
      data: {
        userId: session.sub,
        name: name.trim(),
        avatarColor: avatarColor || "#2C9ED5",
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("[Profiles POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
