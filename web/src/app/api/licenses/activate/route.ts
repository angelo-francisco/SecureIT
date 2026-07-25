import { NextResponse } from "next/server";
import { db } from "@/db";
import { license, licenseKey, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { isValidLicenseKeyFormat } from "@/lib/license-key";
import { signLicensePayload, getPublicKeyPemString } from "@/lib/keys/ed25519";
import { generateId } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const { key, email, hardwareFp } = (await request.json()) as any;

    if (!key || !email) {
      return NextResponse.json(
        { error: "Chave e email são obrigatórios" },
        { status: 400 }
      );
    }

    if (!isValidLicenseKeyFormat(key)) {
      return NextResponse.json({ error: "Formato de chave inválido" }, { status: 400 });
    }

    const licenseKeyRecord = await db
      .select()
      .from(licenseKey)
      .where(eq(licenseKey.key, key))
      .get();

    if (!licenseKeyRecord) {
      return NextResponse.json({ error: "Chave de licença inválida" }, { status: 404 });
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

          const features: string[] =
            licenseKeyRecord.type === "STANDARD" ? ["face_recognition"] : [];
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
              (expiresAtDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            ),
          });
        } else {
          return NextResponse.json({ error: "Licença expirada" }, { status: 400 });
        }
      }
    }

    const foundUser = await db.select().from(user).where(eq(user.email, email)).get();
    if (!foundUser) {
      return NextResponse.json(
        { error: "Utilizador não encontrado. Crie uma conta primeiro." },
        { status: 404 }
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
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const nowStr = now.toISOString();
    const expiresAt = new Date(now.getTime() + licenseKeyRecord.durationDays * 24 * 60 * 60 * 1000);
    const expiresAtStr = expiresAt.toISOString();

    const features: string[] =
      licenseKeyRecord.type === "STANDARD" ? ["face_recognition"] : [];

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
    await (db.transaction as any)(async (tx: any) => {
      await tx
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

      await tx
        .update(licenseKey)
        .set({ status: "ACTIVE" })
        .where(eq(licenseKey.id, licenseKeyRecord.id))
        .run();
    });

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
      { status: 500 }
    );
  }
}
