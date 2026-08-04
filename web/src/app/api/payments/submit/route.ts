import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
	license,
	licenseKey,
	paymentInfo,
	paymentRequest,
	plan,
} from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const body = (await request.json()) as {
			planId?: string;
			proofPublicId?: string;
			proofUrl?: string;
			selectedFeatures?: unknown;
			selectedServices?: unknown;
			totalPrice?: number;
			durationDays?: number;
		};
		const {
			planId,
			proofPublicId,
			proofUrl,
			selectedFeatures,
			selectedServices,
			totalPrice,
			durationDays,
		} = body;

		if (!planId || !proofPublicId || !proofUrl) {
			return NextResponse.json({ error: "Dados em falta" }, { status: 400 });
		}

		const activeLicense = await db
			.select()
			.from(license)
			.innerJoin(licenseKey, eq(license.keyId, licenseKey.id))
			.where(
				and(eq(license.userId, session.sub), eq(licenseKey.status, "ACTIVE")),
			)
			.get();

		if (activeLicense) {
			const expiresAt = new Date(activeLicense.License.expiresAt);
			if (expiresAt > new Date()) {
				return NextResponse.json(
					{
						error:
							"Já possui uma licença ativa. Revogue a licença actual antes de comprar uma nova.",
					},
					{ status: 409 },
				);
			}
		}

		const planRecord = await db
			.select()
			.from(plan)
			.where(eq(plan.id, planId))
			.get();
		if (!planRecord?.isActive) {
			return NextResponse.json(
				{ error: "Plano não encontrado" },
				{ status: 404 },
			);
		}

		const paymentInfoRecord = await db
			.select()
			.from(paymentInfo)
			.where(eq(paymentInfo.isActive, true))
			.limit(1)
			.get();
		if (!paymentInfoRecord) {
			return NextResponse.json(
				{ error: "Dados bancários não configurados" },
				{ status: 500 },
			);
		}

		const payment = await db
			.insert(paymentRequest)
			.values({
				userId: session.sub,
				planId,
				paymentInfoId: paymentInfoRecord.id,
				proofPublicId,
				proofUrl,
				...(selectedFeatures
					? { selectedFeatures: JSON.stringify(selectedFeatures) }
					: {}),
				...(selectedServices
					? { selectedServices: JSON.stringify(selectedServices) }
					: {}),
				...(totalPrice !== undefined && { totalPrice }),
				...(durationDays !== undefined && { durationDays }),
			})
			.returning()
			.get();

		return NextResponse.json({ ...payment, plan: planRecord });
	} catch (error) {
		console.error("[Payment Submit]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
