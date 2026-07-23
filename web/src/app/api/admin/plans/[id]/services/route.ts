import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await params;
  try {
    const services = await prisma.planService.findMany({ where: { planId: id }, orderBy: { createdAt: "asc" } });
    return NextResponse.json(services);
  } catch (error) {
    console.error("[Admin Plan Services GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await params;
  try {
    const body = (await request.json()) as any;
    const { name, description, price } = body;
    if (!name) return NextResponse.json({ error: "Nome em falta" }, { status: 400 });

    const service = await prisma.planService.create({
      data: { planId: id, name, description, price: price || 0 },
    });
    return NextResponse.json(service);
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Serviço já existe neste plano" }, { status: 409 });
    console.error("[Admin Plan Services POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  await params;
  try {
    const body = (await request.json()) as any;
    const { serviceId, name, description, price, isActive } = body;
    if (!serviceId) return NextResponse.json({ error: "serviceId em falta" }, { status: 400 });

    const service = await prisma.planService.update({
      where: { id: serviceId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return NextResponse.json(service);
  } catch (error) {
    console.error("[Admin Plan Services PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  await params;
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    if (!serviceId) return NextResponse.json({ error: "serviceId em falta" }, { status: 400 });

    await prisma.planService.delete({ where: { id: serviceId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Admin Plan Services DELETE]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
