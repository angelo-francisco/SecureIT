import { db } from "@/db";
import { paymentRequest, plan, paymentInfo } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as any;
    const { planId, proofPublicId, proofUrl, selectedFeatures, selectedServices, totalPrice } =
      body;

    if (!planId || !proofPublicId || !proofUrl) {
      return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
    }

    const planRecord = await db.select().from(plan).where(eq(plan.id, planId)).get();
    if (!planRecord || !planRecord.isActive) {
      return NextResponse.json({ error: "Plano não encontrado" }, { status: 404 });
    }

    const paymentInfoRecord = await db
      .select()
      .from(paymentInfo)
      .where(eq(paymentInfo.isActive, true))
      .limit(1)
      .get();
    if (!paymentInfoRecord) {
      return NextResponse.json(
        { error: "Dados bancários não configurados" },
        { status: 500 }
      );
    }

    const payment = await db
      .insert(paymentRequest)
      .values({
        userId: session.sub,
        planId,
        paymentInfoId: paymentInfoRecord.id,
        proofPublicId,
        proofUrl,
        ...(selectedFeatures && { selectedFeatures: JSON.stringify(selectedFeatures) }),
        ...(selectedServices && { selectedServices: JSON.stringify(selectedServices) }),
        ...(totalPrice !== undefined && { totalPrice }),
      })
      .returning()
      .get();

    return NextResponse.json({ ...payment, plan: planRecord });
  } catch (error) {
    console.error("[Payment Submit]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
