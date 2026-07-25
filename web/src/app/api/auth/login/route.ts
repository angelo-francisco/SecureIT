import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createToken, setTokenCookies } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as any;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e password são obrigatórios" },
        { status: 400 }
      );
    }

    const foundUser = await db.select().from(user).where(eq(user.email, email)).get();
    if (!foundUser) {
      return NextResponse.json(
        { error: "Email ou palavra-passe incorrectos" },
        { status: 401 }
      );
    }

    if (!foundUser.isActive) {
      return NextResponse.json(
        { error: "Conta desactivada" },
        { status: 403 }
      );
    }

    const valid = await Bun.password.verify(password, foundUser.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Email ou palavra-passe incorrectos" },
        { status: 401 }
      );
    }

    const accessToken = await createToken(
      { sub: foundUser.id, email: foundUser.email },
      "access"
    );
    const refreshToken = await createToken(
      { sub: foundUser.id, email: foundUser.email },
      "refresh"
    );

    const body = {
      access_token: accessToken,
      user: {
        id: foundUser.id,
        email: foundUser.email,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        phone: foundUser.phone,
        totpEnabled: foundUser.totpEnabled,
        createdAt: foundUser.createdAt,
      },
    };

    const baseResponse = NextResponse.json(body);
    const response = setTokenCookies(baseResponse, accessToken, refreshToken);

    return response;
  } catch (error) {
    console.error("[Login]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
