import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verifyTOTP } from "@/lib/totp";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { code, email } = (await request.json()) as any;

    if (!code) {
      return NextResponse.json(
        { error: "Código é obrigatório" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilizador não encontrado" },
        { status: 404 }
      );
    }

    if (!user.totpSecret) {
      return NextResponse.json(
        { error: "TOTP não está configurado" },
        { status: 400 }
      );
    }

    const valid = verifyTOTP(user.totpSecret, code);
    if (!valid) {
      return NextResponse.json(
        { error: "Código inválido" },
        { status: 401 }
      );
    }

    if (!user.totpEnabled) {
      await prisma.user.update({
        where: { id: user.id },
        data: { totpEnabled: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TOTP Verify]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
