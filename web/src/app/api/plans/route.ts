import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      include: { features: { where: { isActive: true } }, services: { where: { isActive: true } } },
      orderBy: { basePrice: "asc" },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("[Plans GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
