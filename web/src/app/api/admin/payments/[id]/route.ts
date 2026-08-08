import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
	license,
	licenseKey,
	notification,
	paymentRequest,
	plan,
	planFeature,
	user,
} from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { signLicensePayload } from "@/lib/keys/ed25519";
import { generateLicenseKey } from "@/lib/license-key";

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getAdminSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const { id } = await params;
		const body = (await request.json()) as {
			status?: string;
			adminNote?: string;
		};
		const { status, adminNote } = body;

		if (!status || !["APPROVED", "REJECTED"].includes(status)) {
			return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
		}

		const payment = await db
			.select()
			.from(paymentRequest)
			.where(eq(paymentRequest.id, id))
			.get();

		if (!payment) {
			return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
		}

		if (payment.status !== "PENDING") {
			return NextResponse.json(
				{ error: "Pagamento já foi processado" },
				{ status: 400 },
			);
		}

		const planRow = await db
			.select()
			.from(plan)
			.where(eq(plan.id, payment.planId))
			.get();

		const now = new Date().toISOString();

		await db
			.update(paymentRequest)
			.set({
				status,
				adminNote: adminNote || null,
				reviewedAt: now,
			})
			.where(eq(paymentRequest.id, id))
			.run();

		if (status === "APPROVED" && planRow) {
			const nowDate = new Date();
			const licenseDurationDays = payment.durationDays ?? planRow.durationDays;
			const expiresAt = new Date(
				nowDate.getTime() + licenseDurationDays * 24 * 60 * 60 * 1000,
			);
			const expiresAtStr = expiresAt.toISOString();

			const existingLicense = await db
				.select()
				.from(license)
				.where(eq(license.userId, payment.userId))
				.get();

			if (existingLicense) {
				await db
					.update(licenseKey)
					.set({ status: "REVOKED" })
					.where(eq(licenseKey.id, existingLicense.keyId))
					.run();
			}

			const payUser = await db
				.select()
				.from(user)
				.where(eq(user.id, payment.userId))
				.get();

			const features: string[] = ["face_recognition"];

			const defaultPlanFeatures = await db
				.select()
				.from(planFeature)
				.where(
					and(
						eq(planFeature.planId, planRow.id),
						eq(planFeature.isActive, true),
					),
				)
				.all();
			for (const pf of defaultPlanFeatures) {
				const slug = pf.name
					.toLowerCase()
					.replace(/\s+/g, "_")
					.replace(/[^a-z0-9_]/g, "");
				if (!features.includes(slug)) features.push(slug);
			}

			if (payment.selectedFeatures) {
				try {
					const featureIds: string[] = JSON.parse(payment.selectedFeatures);
					if (featureIds.length > 0) {
						const planFeatures = await db
							.select()
							.from(planFeature)
							.where(inArray(planFeature.id, featureIds));
						for (const pf of planFeatures) {
							const slug = pf.name
								.toLowerCase()
								.replace(/\s+/g, "_")
								.replace(/[^a-z0-9_]/g, "");
							if (!features.includes(slug)) features.push(slug);
						}
					}
				} catch {
					// ignore parse errors
				}
			}

			let key = generateLicenseKey();
			let exists = true;
			while (exists) {
				const existing = await db
					.select()
					.from(licenseKey)
					.where(eq(licenseKey.key, key))
					.get();
				if (!existing) exists = false;
				else key = generateLicenseKey();
			}

			const basePayload = {
				key,
				type: planRow.name,
				userId: payment.userId,
				email: payUser?.email ?? "",
				maxCameras: -1,
				maxPeople: -1,
				features,
				activatedAt: now,
				expiresAt: expiresAtStr,
			};

			const signedPayload = await signLicensePayload(basePayload);

			const createdKey = await db
				.insert(licenseKey)
				.values({
					key,
					type: planRow.name,
					durationDays: licenseDurationDays,
					status: "ACTIVE",
				})
				.returning()
				.get();

			if (existingLicense) {
				await db
					.update(license)
					.set({
						keyId: createdKey.id,
						paymentRequestId: payment.id,
						activatedAt: now,
						expiresAt: expiresAtStr,
						signedPayload,
						status: "ACTIVE",
						createdAt: now,
					})
					.where(eq(license.id, existingLicense.id))
					.run();
			} else {
				await db
					.insert(license)
					.values({
						keyId: createdKey.id,
						userId: payment.userId,
						paymentRequestId: payment.id,
						status: "ACTIVE",
						activatedAt: now,
						expiresAt: expiresAtStr,
						signedPayload,
						createdAt: now,
					})
					.run();
			}

			await db
				.insert(notification)
				.values({
					userId: payment.userId,
					type: "LICENSE_APPROVED",
					title: "Licença Aprovada",
					message: `O seu pagamento para o plano "${planRow.name}" foi aprovado. A sua licença está agora ativa.`,
				})
				.run();
		} else if (status === "REJECTED" && planRow) {
			await db
				.insert(notification)
				.values({
					userId: payment.userId,
					type: "LICENSE_REJECTED",
					title: "Pagamento Rejeitado",
					message: `O seu pagamento para o plano "${planRow.name}" foi rejeitado.${adminNote ? ` Motivo: ${adminNote}` : ""}`,
				})
				.run();
		}

		return NextResponse.json({ id, status, adminNote, reviewedAt: now });
	} catch (error) {
		console.error("[Admin Payment PUT]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
