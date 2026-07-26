import { db } from "@/db";
import { planService } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getAdminSession();
	if (!session)
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	const { id } = await params;
	try {
		const services = await db
			.select()
			.from(planService)
			.where(eq(planService.planId, id))
			.orderBy(asc(planService.createdAt))
			.all();
		return NextResponse.json(services);
	} catch (error) {
		console.error("[Admin Plan Services GET]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getAdminSession();
	if (!session)
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	const { id } = await params;
	try {
		const body = (await request.json()) as any;
		const { name, description, price } = body;
		if (!name)
			return NextResponse.json({ error: "Nome em falta" }, { status: 400 });

		const service = await db
			.insert(planService)
			.values({ planId: id, name, description, price: price || 0 })
			.returning()
			.get();
		return NextResponse.json(service);
	} catch (error: any) {
		if (error?.message?.includes("UNIQUE constraint")) {
			return NextResponse.json(
				{ error: "Serviço já existe neste plano" },
				{ status: 409 },
			);
		}
		console.error("[Admin Plan Services POST]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getAdminSession();
	if (!session)
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	await params;
	try {
		const body = (await request.json()) as any;
		const { serviceId, name, description, price, isActive } = body;
		if (!serviceId)
			return NextResponse.json(
				{ error: "serviceId em falta" },
				{ status: 400 },
			);

		const updates: Record<string, unknown> = {};
		if (name !== undefined) updates.name = name;
		if (description !== undefined) updates.description = description;
		if (price !== undefined) updates.price = price;
		if (isActive !== undefined) updates.isActive = isActive;

		const service = await db
			.update(planService)
			.set(updates)
			.where(eq(planService.id, serviceId))
			.returning()
			.get();
		return NextResponse.json(service);
	} catch (error) {
		console.error("[Admin Plan Services PUT]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getAdminSession();
	if (!session)
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	await params;
	try {
		const { searchParams } = new URL(request.url);
		const serviceId = searchParams.get("serviceId");
		if (!serviceId)
			return NextResponse.json(
				{ error: "serviceId em falta" },
				{ status: 400 },
			);

		await db.delete(planService).where(eq(planService.id, serviceId)).run();
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[Admin Plan Services DELETE]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
