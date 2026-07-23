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
    const { description, proofPublicId, proofUrl } = body;

    if (!description) {
      return NextResponse.json({ error: "Descrição em falta" }, { status: 400 });
    }

    const hasPaidLicense = await prisma.paymentRequest.findFirst({
      where: {
        userId: session.sub,
        status: "APPROVED",
      },
    });

    const maintenance = await prisma.maintenanceRequest.create({
      data: {
        userId: session.sub,
        description,
        hasPaidLicense: !!hasPaidLicense,
        ...(proofPublicId && { proofPublicId }),
        ...(proofUrl && { proofUrl }),
      },
    });

    return NextResponse.json(maintenance);
  } catch (error) {
    console.error("[Maintenance Request]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
