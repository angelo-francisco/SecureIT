import { db } from "@/db";
import { plan, planFeature, planService } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const plans = await db.select().from(plan).orderBy(desc(plan.createdAt)).all();

    const plansWithRelations = await Promise.all(
      plans.map(async (p) => {
        const features = await db
          .select()
          .from(planFeature)
          .where(eq(planFeature.planId, p.id))
          .all();
        const services = await db
          .select()
          .from(planService)
          .where(eq(planService.planId, p.id))
          .all();
        return { ...p, features, services };
      })
    );

    return NextResponse.json(plansWithRelations);
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
    const body = (await request.json()) as any;
    const { name, description, basePrice, currency, durationDays } = body;

    if (!name || basePrice === undefined || !durationDays) {
      return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
    }

    const created = await db
      .insert(plan)
      .values({
        name,
        description,
        basePrice,
        currency: currency || "USD",
        durationDays,
        updatedAt: new Date().toISOString(),
      })
      .returning()
      .get();

    return NextResponse.json(created);
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
    const body = (await request.json()) as any;
    const { id, name, description, basePrice, currency, durationDays, isActive, isDefault } =
      body;

    if (!id) {
      return NextResponse.json({ error: "ID em falta" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (basePrice !== undefined) updates.basePrice = basePrice;
    if (currency !== undefined) updates.currency = currency;
    if (durationDays !== undefined) updates.durationDays = durationDays;
    if (isActive !== undefined) updates.isActive = isActive;
    if (isDefault !== undefined) updates.isDefault = isDefault;
    updates.updatedAt = new Date().toISOString();

    const updated = await db.update(plan).set(updates).where(eq(plan.id, id)).returning().get();
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Admin Plans PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
