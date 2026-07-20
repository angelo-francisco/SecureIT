import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const info = await prisma.paymentInfo.findFirst({ where: { isActive: true } });
    return NextResponse.json(info || null);
  } catch (error) {
    console.error("[Admin PaymentInfo GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { iban, accountName, bankName } = body;

    if (!iban || !accountName) {
      return NextResponse.json({ error: "IBAN e nome da conta são obrigatórios" }, { status: 400 });
    }

    const existing = await prisma.paymentInfo.findFirst({ where: { isActive: true } });

    if (existing) {
      const updated = await prisma.paymentInfo.update({
        where: { id: existing.id },
        data: { iban, accountName, bankName },
      });
      return NextResponse.json(updated);
    }

    const created = await prisma.paymentInfo.create({
      data: { iban, accountName, bankName },
    });
    return NextResponse.json(created);
  } catch (error) {
    console.error("[Admin PaymentInfo PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
