import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as any;
    const { planId, proofPublicId, proofUrl, selectedFeatures, selectedServices, totalPrice } = body;

    if (!planId || !proofPublicId || !proofUrl) {
      return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    const paymentInfo = await prisma.paymentInfo.findFirst({
      where: { isActive: true },
    });
    if (!paymentInfo) {
      return NextResponse.json({ error: "Dados bancários não configurados" }, { status: 500 });
    }

    const payment = await prisma.paymentRequest.create({
      data: {
        userId: session.sub,
        planId,
        paymentInfoId: paymentInfo.id,
        proofPublicId,
        proofUrl,
        ...(selectedFeatures && { selectedFeatures: JSON.stringify(selectedFeatures) }),
        ...(selectedServices && { selectedServices: JSON.stringify(selectedServices) }),
        ...(totalPrice !== undefined && { totalPrice }),
      },
      include: { plan: true },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error("[Payment Submit]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
