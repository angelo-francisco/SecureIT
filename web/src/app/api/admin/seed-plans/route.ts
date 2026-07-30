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
		await db.delete(planService).run();
		await db.delete(planFeature).run();
		await db.delete(plan).run();

		const now = new Date().toISOString();

		const licenca = await db
			.insert(plan)
			.values({
				name: "Licença",
				description: "Acesso completo a todas as funcionalidades do SecureIT",
				basePrice: 81.27,
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
					planId: licenca.id,
					name: "Análise Comportamental",
					description: "Análise avançada de comportamento em tempo real",
					price: 0,
				},
				{
					planId: licenca.id,
					name: "Cloud Storage",
					description: "Armazenamento de gravações na cloud",
					price: 0,
				},
				{
					planId: licenca.id,
					name: "Tunnel de Acesso Remoto",
					description: "Acesso remoto seguro às suas câmeras",
					price: 0,
				},
			])
			.run();

		const features = await db
			.select()
			.from(planFeature)
			.where(eq(planFeature.planId, licenca.id))
			.all();

		return NextResponse.json({
			message: "Plano criado com sucesso",
			plans: [{ ...licenca, features, services: [] }],
		});
	} catch (error) {
		console.error("[Seed Plans]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
