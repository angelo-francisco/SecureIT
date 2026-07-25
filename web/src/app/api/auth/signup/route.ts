import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, setTokenCookies } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, pin, firstName, lastName, phone } =
      (await request.json()) as any;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Campos obrigatórios em falta" },
        { status: 400 }
      );
    }

    if (password.length < 12) {
      return NextResponse.json(
        { error: "Palavra-passe deve ter pelo menos 12 caracteres" },
        { status: 400 }
      );
    }

    if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
      return NextResponse.json(
        { error: "O PIN deve conter 4 dígitos" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email já registado" },
        { status: 409 }
      );
    }

    const passwordHash = await Bun.password.hash(password, {
  algorithm: "bcrypt",
  cost: 12
});
    const pinHash = pin ? await Bun.password.hash(pin, {
  algorithm: "bcrypt",
  cost: 12
}); : null;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        pinHash,
        firstName,
        lastName,
        phone: phone || null,
        profiles: {
          create: {
            name: firstName,
            avatarColor: "#2C9ED5",
            isDefault: true,
          },
        },
      },
    });

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
    console.error("[Signup]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
