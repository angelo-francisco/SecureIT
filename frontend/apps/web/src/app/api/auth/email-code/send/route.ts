import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEmailCode, sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
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
