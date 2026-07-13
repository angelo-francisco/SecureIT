import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createTOTP, getTOTPUri } from "@/lib/totp";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
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

    if (user.totpEnabled) {
      return NextResponse.json(
        { error: "TOTP já está configurado" },
        { status: 400 }
      );
    }

    const totp = createTOTP(user.email);
    const secret = totp.secret.base32;
    const uri = getTOTPUri(totp);

    await prisma.user.update({
      where: { id: user.id },
      data: { totpSecret: secret },
    });

    return NextResponse.json({ secret, uri });
  } catch (error) {
    console.error("[TOTP Setup]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
