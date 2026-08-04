import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { paymentInfo } from "@/db/schema";
import { decryptPaymentInfo } from "@/lib/crypto";

export async function GET() {
	try {
		const info = await db
			.select()
			.from(paymentInfo)
			.where(eq(paymentInfo.isActive, true))
			.limit(1)
			.get();
		return NextResponse.json(info ? await decryptPaymentInfo(info) : null);
	} catch (error) {
		console.error("[PaymentInfo GET]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
