import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/db";
import { plan, planFeature, planService } from "@/db/schema";
import { eq } from "drizzle-orm";
import { GET } from "@/app/api/plans/route";
import { GET as PAYMENT_INFO_GET } from "@/app/api/payment-info/route";
import { generateId } from "@/db/schema";

let planId = "";

beforeAll(async () => {
	planId = generateId();
	const now = new Date().toISOString();
	await db
		.insert(plan)
		.values({
			id: planId,
			name: "TestPlan",
			description: "A test plan",
			basePrice: 29.99,
			currency: "USD",
			durationDays: 30,
			updatedAt: now,
		})
		.run();
	await db
		.insert(planFeature)
		.values({
			planId,
			name: "Face Detection",
			description: "Detect faces",
			price: 0,
		})
		.run();
	await db
		.insert(planFeature)
		.values({
			planId,
			name: "Inactive Feature",
			description: "Should not appear",
			price: 5,
			isActive: false,
		})
		.run();
	await db
		.insert(planService)
		.values({
			planId,
			name: "Installation",
			description: "Setup service",
			price: 10,
		})
		.run();
});

afterAll(async () => {
	await db.delete(planFeature).where(eq(planFeature.planId, planId)).run();
	await db.delete(planService).where(eq(planService.planId, planId)).run();
	await db.delete(plan).where(eq(plan.id, planId)).run();
});

describe("GET /api/plans", () => {
	it("returns active plans with features and services", async () => {
		const res = await GET();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(Array.isArray(data)).toBe(true);
		const found = data.find((p: any) => p.id === planId);
		expect(found).toBeDefined();
		expect(found.name).toBe("TestPlan");
		expect(found.basePrice).toBe(29.99);
		expect(found.features.length).toBe(1);
		expect(found.features[0].name).toBe("Face Detection");
		expect(found.services.length).toBe(1);
		expect(found.services[0].name).toBe("Installation");
	});

	it("sorts plans by basePrice ascending", async () => {
		const res = await GET();
		const data = await res.json();
		for (let i = 1; i < data.length; i++) {
			expect(data[i].basePrice).toBeGreaterThanOrEqual(data[i - 1].basePrice);
		}
	});

	it("excludes inactive features", async () => {
		const res = await GET();
		const data = await res.json();
		const found = data.find((p: any) => p.id === planId);
		const inactive = found.features.find(
			(f: any) => f.name === "Inactive Feature",
		);
		expect(inactive).toBeUndefined();
	});
});

describe("GET /api/payment-info", () => {
	it("returns null when no payment info exists", async () => {
		const res = await PAYMENT_INFO_GET();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data).toBeNull();
	});
});
