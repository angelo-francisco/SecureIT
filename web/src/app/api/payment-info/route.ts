import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const info = await prisma.paymentInfo.findFirst({ where: { isActive: true } });
    return NextResponse.json(info || null);
  } catch (error) {
    console.error("[PaymentInfo GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
