import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
	generateId,
	license,
	licenseKey,
	paymentRequest,
	plan,
	planFeature,
	user,
} from "@/db/schema";
import { getPublicKeyPemString, signLicensePayload } from "@/lib/keys/ed25519";
import { isValidLicenseKeyFormat } from "@/lib/license-key";

function buildFeatureSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/\s+/g, "_")
		.replace(/[^a-z0-9_]/g, "");
}

async function _getPlanFeatures(
	type: string,
	paymentRequestId?: string | null,
): Promise<string[]> {
	const features: string[] = ["face_recognition"];
	try {
		const planRow = await db
			.select()
			.from(plan)
			.where(and(eq(plan.name, type), eq(plan.isActive, true)))
			.get();
		if (planRow) {
			const planFeaturesList = await db
				.select()
				.from(planFeature)
				.where(
					and(
						eq(planFeature.planId, planRow.id),
						eq(planFeature.isActive, true),
					),
				)
				.all();
			for (const pf of planFeaturesList) {
				const slug = buildFeatureSlug(pf.name);
				if (!features.includes(slug)) features.push(slug);
			}
		}

		if (paymentRequestId) {
			const payReq = await db
				.select()
				.from(paymentRequest)
				.where(eq(paymentRequest.id, paymentRequestId))
				.get();
			if (payReq?.selectedFeatures) {
				try {
					const featureIds: string[] = JSON.parse(payReq.selectedFeatures);
					if (featureIds.length > 0) {
						const selectedPFs = await db
							.select()
							.from(planFeature)
							.where(inArray(planFeature.id, featureIds));
						for (const pf of selectedPFs) {
							const slug = buildFeatureSlug(pf.name);
							if (!features.includes(slug)) features.push(slug);
						}
					}
				} catch {
					// ignore parse error
				}
			}
		}
	} catch {
		// fallback to just face_recognition
	}
	return features;
}

export async function POST(request: Request) {
	try {
		const { key, email, hardwareFp } = (await request.json()) as {
			key?: string;
			email?: string;
			hardwareFp?: string;
		};

		if (!key || !email) {
			return NextResponse.json(
				{ error: "Chave e email são obrigatórios" },
				{ status: 400 },
			);
		}

		if (!isValidLicenseKeyFormat(key)) {
			return NextResponse.json(
				{ error: "Formato de chave inválido" },
				{ status: 400 },
			);
		}

		const licenseKeyRecord = await db
			.select()
			.from(licenseKey)
			.where(eq(licenseKey.key, key))
			.get();

		if (!licenseKeyRecord) {
			return NextResponse.json(
				{ error: "Chave de licença inválida" },
				{ status: 404 },
			);
		}

		if (licenseKeyRecord.status === "REVOKED") {
			return NextResponse.json({ error: "Licença revogada" }, { status: 403 });
		}

		if (licenseKeyRecord.status === "ACTIVE") {
			const existingLicense = await db
				.select()
				.from(license)
				.where(eq(license.keyId, licenseKeyRecord.id))
				.get();

			if (existingLicense) {
				const expiresAtDate = new Date(existingLicense.expiresAt);
				if (expiresAtDate > new Date()) {
					const licUser = await db
						.select()
						.from(user)
						.where(eq(user.id, existingLicense.userId))
						.get();

					const features = await _getPlanFeatures(
						licenseKeyRecord.type,
						existingLicense.paymentRequestId,
					);
					const publicKey = await getPublicKeyPemString();

					let signedPayload = existingLicense.signedPayload;
					if (!signedPayload) {
						const payload = {
							key: licenseKeyRecord.key,
							type: licenseKeyRecord.type,
							userId: existingLicense.userId,
							email: licUser?.email ?? "",
							maxCameras: licenseKeyRecord.maxCameras,
							maxPeople: licenseKeyRecord.maxPeople,
							features,
							activatedAt: existingLicense.activatedAt,
							expiresAt: existingLicense.expiresAt,
						};
						signedPayload = await signLicensePayload(payload);
						await db
							.update(license)
							.set({ signedPayload })
							.where(eq(license.id, existingLicense.id))
							.run();
					}

					return NextResponse.json({
						valid: true,
						licenseId: existingLicense.id,
						expiresAt: existingLicense.expiresAt,
						activatedAt: existingLicense.activatedAt,
						type: licenseKeyRecord.type,
						signedPayload,
						publicKey,
						maxCameras: licenseKeyRecord.maxCameras,
						maxPeople: licenseKeyRecord.maxPeople,
						features,
						daysRemaining: Math.ceil(
							(expiresAtDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
						),
					});
				} else {
					return NextResponse.json(
						{ error: "Licença expirada" },
						{ status: 400 },
					);
				}
			}
		}

		const foundUser = await db
			.select()
			.from(user)
			.where(eq(user.email, email))
			.get();
		if (!foundUser) {
			return NextResponse.json(
				{ error: "Utilizador não encontrado. Crie uma conta primeiro." },
				{ status: 404 },
			);
		}

		const existingUserLicense = await db
			.select()
			.from(license)
			.where(eq(license.userId, foundUser.id))
			.get();

		if (existingUserLicense) {
			const existingExpires = new Date(existingUserLicense.expiresAt);
			if (existingExpires > new Date()) {
				return NextResponse.json(
					{ error: "Já possui uma licença activa" },
					{ status: 400 },
				);
			}
		}

		const now = new Date();
		const nowStr = now.toISOString();
		const expiresAt = new Date(
			now.getTime() + licenseKeyRecord.durationDays * 24 * 60 * 60 * 1000,
		);
		const expiresAtStr = expiresAt.toISOString();

		const features = await _getPlanFeatures(licenseKeyRecord.type);

		const licensePayload = {
			key: licenseKeyRecord.key,
			type: licenseKeyRecord.type,
			userId: foundUser.id,
			email: foundUser.email,
			maxCameras: licenseKeyRecord.maxCameras,
			maxPeople: licenseKeyRecord.maxPeople,
			features,
			activatedAt: nowStr,
			expiresAt: expiresAtStr,
		};

		const signedPayload = await signLicensePayload(licensePayload);
		const publicKey = await getPublicKeyPemString();

		const licId = generateId();
		await db
			.insert(license)
			.values({
				id: licId,
				keyId: licenseKeyRecord.id,
				userId: foundUser.id,
				activatedAt: nowStr,
				expiresAt: expiresAtStr,
				hardwareFp: hardwareFp || null,
				signedPayload,
			})
			.run();
		await db
			.update(licenseKey)
			.set({ status: "ACTIVE" })
			.where(eq(licenseKey.id, licenseKeyRecord.id))
			.run();

		return NextResponse.json({
			valid: true,
			licenseId: licId,
			expiresAt: expiresAtStr,
			activatedAt: nowStr,
			type: licenseKeyRecord.type,
			signedPayload,
			publicKey,
			maxCameras: licenseKeyRecord.maxCameras,
			maxPeople: licenseKeyRecord.maxPeople,
			features,
			daysRemaining: licenseKeyRecord.durationDays,
		});
	} catch (error) {
		console.error("[License Activate]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
