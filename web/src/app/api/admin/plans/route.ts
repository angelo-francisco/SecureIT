import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const plans = await prisma.plan.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("[Admin Plans GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { name, description, price, currency, durationDays } = body;

    if (!name || !price || !durationDays) {
      return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
    }

    const plan = await prisma.plan.create({
      data: { name, description, price, currency: currency || "EUR", durationDays },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("[Admin Plans POST]", error);
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
    const { id, name, description, price, currency, durationDays, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID em falta" }, { status: 400 });
    }

    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(currency !== undefined && { currency }),
        ...(durationDays !== undefined && { durationDays }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return NextResponse.json(plan);
  } catch (error) {
    console.error("[Admin Plans PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
