import { db } from "@/db";
import { paymentRequest, plan, licenseKey, license, user, notification } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { generateLicenseKey } from "@/lib/license-key";
import { signLicensePayload } from "@/lib/keys/ed25519";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = (await request.json()) as any;
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
        { status: 400 }
      );
    }

    const planRow = await db.select().from(plan).where(eq(plan.id, payment.planId)).get();

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
      const expiresAt = new Date(
        nowDate.getTime() + planRow.durationDays * 24 * 60 * 60 * 1000
      );
      const expiresAtStr = expiresAt.toISOString();

      const existingLicense = await db
        .select()
        .from(license)
        .where(eq(license.userId, payment.userId))
        .get();

      let existingKey: typeof licenseKey.$inferSelect | undefined;
      if (existingLicense) {
        existingKey = await db
          .select()
          .from(licenseKey)
          .where(eq(licenseKey.id, existingLicense.keyId))
          .get();
      }

      const payUser = await db.select().from(user).where(eq(user.id, payment.userId)).get();

      const features: string[] =
        planRow.name === "STANDARD" ? ["face_recognition"] : [];

      const basePayload = {
        type: planRow.name,
        userId: payment.userId,
        email: payUser?.email ?? "",
        maxCameras: planRow.name === "TRIAL" ? 1 : -1,
        maxPeople: planRow.name === "TRIAL" ? 10 : -1,
        features,
        activatedAt: now,
        expiresAt: expiresAtStr,
      };

      if (!existingLicense || !existingKey) {
        let key = generateLicenseKey();
        let exists = true;
        while (exists) {
          const existing = await db.select().from(licenseKey).where(eq(licenseKey.key, key)).get();
          if (!existing) exists = false;
          else key = generateLicenseKey();
        }

        const signedPayload = await signLicensePayload({ ...basePayload, key });

        const createdKey = await db
          .insert(licenseKey)
          .values({
            key,
            type: planRow.name,
            durationDays: planRow.durationDays,
            status: "ACTIVE",
          })
          .returning()
          .get();

        await db
          .insert(license)
          .values({
            keyId: createdKey.id,
            userId: payment.userId,
            paymentRequestId: payment.id,
            activatedAt: now,
            expiresAt: expiresAtStr,
            signedPayload,
          })
          .run();
      } else {
        const existingExpires = new Date(existingLicense.expiresAt);
        const newExpiresAt =
          existingExpires.getTime() > nowDate.getTime()
            ? new Date(
                existingExpires.getTime() +
                  planRow.durationDays * 24 * 60 * 60 * 1000
              )
            : expiresAt;

        const signedPayload = await signLicensePayload({
          ...basePayload,
          key: existingKey.key,
          expiresAt: newExpiresAt.toISOString(),
        });

        await db
          .update(license)
          .set({
            expiresAt: newExpiresAt.toISOString(),
            signedPayload,
          })
          .where(eq(license.id, existingLicense.id))
          .run();
      }

      await db.insert(notification).values({
        userId: payment.userId,
        type: "LICENSE_APPROVED",
        title: "Licença Aprovada",
        message: `O seu pagamento para o plano "${planRow.name}" foi aprovado. A sua licença está agora ativa.`,
      }).run();
    } else if (status === "REJECTED" && planRow) {
      await db.insert(notification).values({
        userId: payment.userId,
        type: "LICENSE_REJECTED",
        title: "Pagamento Rejeitado",
        message: `O seu pagamento para o plano "${planRow.name}" foi rejeitado.${adminNote ? ` Motivo: ${adminNote}` : ""}`,
      }).run();
    }

    return NextResponse.json({ id, status, adminNote, reviewedAt: now });
  } catch (error) {
    console.error("[Admin Payment PUT]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
