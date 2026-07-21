import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyEmailCode } from "@/lib/email";
import { createToken, setTokenCookies } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, code } = (await request.json()) as any;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email e código são obrigatórios" },
        { status: 400 }
      );
    }

    const valid = await verifyEmailCode(email, code);
    if (!valid) {
      return NextResponse.json(
        { error: "Código inválido ou expirado" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Utilizador não encontrado" },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Conta desativada" },
        { status: 403 }
      );
    }

    const accessToken = await createToken({ sub: user.id, email: user.email }, "access");
    const refreshToken = await createToken({ sub: user.id, email: user.email }, "refresh");

    const body = {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        totpEnabled: user.totpEnabled,
        createdAt: user.createdAt,
      },
    };

    const baseResponse = NextResponse.json(body);
    const response = setTokenCookies(baseResponse, accessToken, refreshToken);

    return response;
  } catch (error) {
    console.error("[Email Code Verify]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
