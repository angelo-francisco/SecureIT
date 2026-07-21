import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, pin } = (await request.json()) as any;

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
    if (!user || !user.pinHash) {
      return NextResponse.json(
        { error: "PIN incorrecto" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Conta desativada" },
        { status: 403 }
      );
    }

    const validPin = await bcrypt.compare(pin, user.pinHash);
    if (!validPin) {
      return NextResponse.json(
        { error: "PIN incorrecto" },
        { status: 401 }
      );
    }

    const pinToken = await createToken(
      { sub: user.id, email: user.email },
      "access"
    );

    return NextResponse.json({ pin_token: pinToken });
  } catch (error) {
    console.error("[Pin Verify]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
