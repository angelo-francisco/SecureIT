import { NextResponse } from "next/server";
import { createToken } from "@/lib/auth";
import { db } from "@/db";
import { adminUser } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as any;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e password são obrigatórios" },
        { status: 400 }
      );
    }

    const user = await db.select().from(adminUser).where(eq(adminUser.email, email)).get();
    if (!user) {
      return NextResponse.json(
        { error: "Email ou palavra-passe incorrectos" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const token = await createToken({ sub: "admin", email });

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
