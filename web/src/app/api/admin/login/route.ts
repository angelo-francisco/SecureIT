import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@secureit.com";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e password são obrigatórios" },
        { status: 400 }
      );
    }

    if (email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    if (!ADMIN_PASSWORD_HASH) {
      console.error("[Admin Login] ADMIN_PASSWORD_HASH não configurado");
      return NextResponse.json(
        { error: "Configuração de admin em falta" },
        { status: 500 }
      );
    }

    const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const token = await createToken({ sub: "admin", email: ADMIN_EMAIL });

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Admin Login]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
