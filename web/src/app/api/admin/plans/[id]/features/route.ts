import { db } from "@/db";
import { planFeature } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { id } = await params;
  try {
    const features = await db
      .select()
      .from(planFeature)
      .where(eq(planFeature.planId, id))
      .orderBy(asc(planFeature.createdAt))
      .all();
    return NextResponse.json(features);
  } catch (error) {
    console.error("[Admin Plan Features GET]", error);
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

    const feature = await db
      .insert(planFeature)
      .values({ planId: id, name, description, price: price || 0 })
      .returning()
      .get();
    return NextResponse.json(feature);
  } catch (error: any) {
    if (error?.message?.includes("UNIQUE constraint")) {
      return NextResponse.json({ error: "Feature já existe neste plano" }, { status: 409 });
    }
    console.error("[Admin Plan Features POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  await params;
  try {
    const body = (await request.json()) as any;
    const { featureId, name, description, price, isActive } = body;
    if (!featureId) return NextResponse.json({ error: "featureId em falta" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = price;
    if (isActive !== undefined) updates.isActive = isActive;

    const feature = await db
      .update(planFeature)
      .set(updates)
      .where(eq(planFeature.id, featureId))
      .returning()
      .get();
    return NextResponse.json(feature);
  } catch (error) {
    console.error("[Admin Plan Features PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  await params;
  try {
    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get("featureId");
    if (!featureId) return NextResponse.json({ error: "featureId em falta" }, { status: 400 });

    await db.delete(planFeature).where(eq(planFeature.id, featureId)).run();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Admin Plan Features DELETE]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
