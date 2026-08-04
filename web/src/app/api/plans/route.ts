import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { plan, planFeature, planService } from "@/db/schema";

export async function GET() {
	try {
		const plans = await db
			.select()
			.from(plan)
			.where(eq(plan.isActive, true))
			.all();

		const plansWithRelations = await Promise.all(
			plans.map(async (p) => {
				const features = await db
					.select()
					.from(planFeature)
					.where(eq(planFeature.planId, p.id))
					.all();
				const activeFeatures = features.filter((f) => f.isActive);
				const services = await db
					.select()
					.from(planService)
					.where(eq(planService.planId, p.id))
					.all();
				const activeServices = services.filter((s) => s.isActive);
				return { ...p, features: activeFeatures, services: activeServices };
			}),
		);

		plansWithRelations.sort((a, b) => a.basePrice - b.basePrice);

		return NextResponse.json(plansWithRelations);
	} catch (error) {
		console.error("[Plans GET]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
