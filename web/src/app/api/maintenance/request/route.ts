import { db } from "@/db";
import { maintenanceRequest, license, paymentRequest } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as any;
    const { licenseId, description, proofPublicId, proofUrl } = body;

    if (!licenseId) {
      return NextResponse.json({ error: "Licença em falta" }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: "Descrição em falta" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const lic = await db
      .select()
      .from(license)
      .where(
        and(
          eq(license.id, licenseId),
          eq(license.userId, session.sub),
          eq(license.status, "ACTIVE")
        )
      )
      .get();

    if (!lic || new Date(lic.expiresAt) <= new Date()) {
      return NextResponse.json(
        { error: "Licença inválida ou inativa" },
        { status: 400 }
      );
    }

    const hasPaidLicense = await db
      .select()
      .from(paymentRequest)
      .where(
        and(eq(paymentRequest.userId, session.sub), eq(paymentRequest.status, "APPROVED"))
      )
      .limit(1)
      .get();

    const created = await db
      .insert(maintenanceRequest)
      .values({
        userId: session.sub,
        licenseId,
        description,
        hasPaidLicense: !!hasPaidLicense,
        ...(proofPublicId && { proofPublicId }),
        ...(proofUrl && { proofUrl }),
      })
      .returning()
      .get();

    return NextResponse.json(created);
  } catch (error) {
    console.error("[Maintenance Request]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
