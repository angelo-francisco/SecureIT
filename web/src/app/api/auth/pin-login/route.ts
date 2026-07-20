import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createToken, setTokenCookies } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, pin } = await request.json();

    if (!email || !pin) {
      return NextResponse.json(
        { error: "Email e PIN são obrigatórios" },
        { status: 400 }
      );
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "O PIN deve conter 4 dígitos" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Email ou PIN incorrectos" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Conta desactivada" },
        { status: 403 }
      );
    }

    if (!user.pinHash) {
      return NextResponse.json(
        { error: "PIN não configurado" },
        { status: 400 }
      );
    }

    const validPin = await bcrypt.compare(pin, user.pinHash);
    if (!validPin) {
      return NextResponse.json(
        { error: "Email ou PIN incorrectos" },
        { status: 401 }
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
    console.error("[Pin Login]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
