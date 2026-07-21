import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as any;

    if (!email) {
      return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Email não encontrado" }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Conta desactivada" }, { status: 403 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("[CheckEmail]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
