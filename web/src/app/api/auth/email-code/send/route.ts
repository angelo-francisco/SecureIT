import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createEmailCode, sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as any;

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    const foundUser = await db.select().from(user).where(eq(user.email, email)).get();
    if (!foundUser) {
      return NextResponse.json(
        { error: "Email não registado" },
        { status: 404 }
      );
    }

    const code = await createEmailCode(email);
    await sendVerificationEmail(email, code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Email Code Send]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
