import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { isValidLicenseKeyFormat } from "@/lib/license-key";
import {
  signLicensePayload,
  getPublicKeyPemString,
} from "@/lib/keys/ed25519";

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
      return NextResponse.json(
        { error: "Formato de chave inválido" },
        { status: 400 }
      );
    }

    const licenseKey = await prisma.licenseKey.findUnique({
      where: { key },
    });

    if (!licenseKey) {
      return NextResponse.json(
        { error: "Chave de licença inválida" },
        { status: 404 }
      );
    }

    if (licenseKey.status === "REVOKED") {
      return NextResponse.json(
        { error: "Licença revogada" },
        { status: 403 }
      );
    }

    if (licenseKey.status === "ACTIVE") {
      const existingLicense = await prisma.license.findUnique({
        where: { keyId: licenseKey.id },
      });

      if (existingLicense) {
        if (existingLicense.expiresAt > new Date()) {
          const features: string[] =
            licenseKey.type === "STANDARD" ? ["face_recognition"] : [];
          const publicKey = await getPublicKeyPemString();
          return NextResponse.json({
            valid: true,
            licenseId: existingLicense.id,
            expiresAt: existingLicense.expiresAt,
            activatedAt: existingLicense.activatedAt,
            type: licenseKey.type,
            signedPayload: existingLicense.signedPayload,
            publicKey,
            maxCameras: licenseKey.maxCameras,
            maxPeople: licenseKey.maxPeople,
            features,
            daysRemaining: Math.ceil(
              (existingLicense.expiresAt.getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            ),
          });
        } else {
          return NextResponse.json(
            { error: "Licença expirada" },
            { status: 400 }
          );
        }
      }
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Utilizador não encontrado. Crie uma conta primeiro." },
        { status: 404 }
      );
    }

    const existingUserLicense = await prisma.license.findUnique({
      where: { userId: user.id },
    });

    if (existingUserLicense && existingUserLicense.expiresAt > new Date()) {
      return NextResponse.json(
        { error: "Já possui uma licença activa" },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + licenseKey.durationDays * 24 * 60 * 60 * 1000
    );

    const maxCameras = licenseKey.maxCameras;
    const maxPeople = licenseKey.maxPeople;
    const features: string[] =
      licenseKey.type === "STANDARD" ? ["face_recognition"] : [];

    const licensePayload = {
      key: licenseKey.key,
      type: licenseKey.type,
      userId: user.id,
      email: user.email,
      maxCameras,
      maxPeople,
      features,
      activatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    const signedPayload = await signLicensePayload(licensePayload);
    const publicKey = await getPublicKeyPemString();

    const license = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const lic = await tx.license.create({
          data: {
            keyId: licenseKey.id,
            userId: user.id,
            activatedAt: now,
            expiresAt,
            hardwareFp: hardwareFp || null,
            signedPayload,
          },
        });

        await tx.licenseKey.update({
          where: { id: licenseKey.id },
          data: { status: "ACTIVE" },
        });

        return lic;
      }
    );

    return NextResponse.json({
      valid: true,
      licenseId: license.id,
      expiresAt: license.expiresAt,
      activatedAt: license.activatedAt,
      type: licenseKey.type,
      signedPayload,
      publicKey,
      maxCameras,
      maxPeople,
      features,
      daysRemaining: licenseKey.durationDays,
    });
  } catch (error) {
    console.error("[License Activate]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
