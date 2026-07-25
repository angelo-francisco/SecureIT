import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as any;

    if (!email) {
      return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
    }

    const foundUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .get();

    if (!foundUser) {
      return NextResponse.json({ error: "Email não encontrado" }, { status: 404 });
    }

    if (!foundUser.isActive) {
      return NextResponse.json({ error: "Conta desactivada" }, { status: 403 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("[CheckEmail]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
