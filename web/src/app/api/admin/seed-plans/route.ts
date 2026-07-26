import { db } from "@/db";
import { plan, planFeature, planService } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function POST() {
	const session = await getAdminSession();
	if (!session)
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

	try {
		const existing = await db.select().from(plan).limit(1).get();
		if (existing) {
			const plans = await db.select().from(plan).all();
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
				}),
			);
			return NextResponse.json({
				message: "Planos já existem",
				plans: plansWithRelations,
			});
		}

		const now = new Date().toISOString();

		const b2c = await db
			.insert(plan)
			.values({
				name: "B2C",
				description: "Para residências ou utilizadores individuas",
				basePrice: 75.25,
				currency: "USD",
				durationDays: 30,
				isDefault: true,
				updatedAt: now,
			})
			.returning()
			.get();

		await db
			.insert(planFeature)
			.values([
				{
					planId: b2c.id,
					name: "Análise Comportamental",
					description: "Análise avançada de comportamento em tempo real",
					price: 0,
				},
				{
					planId: b2c.id,
					name: "Cloud Storage",
					description: "Armazenamento de gravações na cloud",
					price: 0,
				},
				{
					planId: b2c.id,
					name: "Tunnel de Acesso Remoto",
					description: "Acesso remoto seguro às suas câmeras",
					price: 0,
				},
			])
			.run();

		await db
			.insert(planService)
			.values({
				planId: b2c.id,
				name: "Instalação e Configuração",
				description: "Instalação profissional do sistema",
				price: 12,
			})
			.run();

		const b2b = await db
			.insert(plan)
			.values({
				name: "B2B",
				description: "Para para empresas e negócios",
				basePrice: 81.27,
				currency: "USD",
				durationDays: 30,
				updatedAt: now,
			})
			.returning()
			.get();

		await db
			.insert(planFeature)
			.values([
				{
					planId: b2b.id,
					name: "Análise Comportamental",
					description: "Análise avançada de comportamento em tempo real",
					price: 0,
				},
				{
					planId: b2b.id,
					name: "Cloud Storage",
					description: "Armazenamento de gravações na cloud",
					price: 0,
				},
				{
					planId: b2b.id,
					name: "Tunnel de Acesso Remoto",
					description: "Acesso remoto seguro às suas câmeras",
					price: 0,
				},
			])
			.run();

		await db
			.insert(planService)
			.values({
				planId: b2b.id,
				name: "Instalação e Configuração",
				description: "Instalação profissional do sistema",
				price: 16,
			})
			.run();

		const b2cFeatures = await db
			.select()
			.from(planFeature)
			.where(eq(planFeature.planId, b2c.id))
			.all();
		const b2cServices = await db
			.select()
			.from(planService)
			.where(eq(planService.planId, b2c.id))
			.all();
		const b2bFeatures = await db
			.select()
			.from(planFeature)
			.where(eq(planFeature.planId, b2b.id))
			.all();
		const b2bServices = await db
			.select()
			.from(planService)
			.where(eq(planService.planId, b2b.id))
			.all();

		return NextResponse.json({
			message: "Planos criados com sucesso",
			plans: [
				{ ...b2c, features: b2cFeatures, services: b2cServices },
				{ ...b2b, features: b2bFeatures, services: b2bServices },
			],
		});
	} catch (error) {
		console.error("[Seed Plans]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
