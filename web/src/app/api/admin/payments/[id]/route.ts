import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { generateLicenseKey } from "@/lib/license-key";
import {
  signLicensePayload,
  getPublicKeyPemString,
} from "@/lib/keys/ed25519";

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

    const payment = await prisma.paymentRequest.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json({ error: "Pagamento já foi processado" }, { status: 400 });
    }

    const updated = await prisma.paymentRequest.update({
      where: { id },
      data: {
        status,
        adminNote: adminNote || null,
        reviewedAt: new Date(),
      },
    });

    if (status === "APPROVED") {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + payment.plan.durationDays * 24 * 60 * 60 * 1000);

      const existingLicense = await prisma.license.findUnique({
        where: { userId: payment.userId },
        include: { key: true },
      });

      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
      });

      const features: string[] =
        payment.plan.name === "STANDARD" ? ["face_recognition"] : [];

      const basePayload = {
        type: payment.plan.name,
        userId: payment.userId,
        email: user?.email ?? "",
        maxCameras: payment.plan.name === "TRIAL" ? 1 : -1,
        maxPeople: payment.plan.name === "TRIAL" ? 10 : -1,
        features,
        activatedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      if (!existingLicense) {
        let key = generateLicenseKey();
        let exists = true;
        while (exists) {
          const existing = await prisma.licenseKey.findUnique({ where: { key } });
          if (!existing) exists = false;
          else key = generateLicenseKey();
        }

        const signedPayload = await signLicensePayload({ ...basePayload, key });

        const licenseKey = await prisma.licenseKey.create({
          data: {
            key,
            type: payment.plan.name,
            durationDays: payment.plan.durationDays,
            status: "ACTIVE",
          },
        });

        await prisma.license.create({
          data: {
            keyId: licenseKey.id,
            userId: payment.userId,
            paymentRequestId: payment.id,
            activatedAt: now,
            expiresAt,
            signedPayload,
          },
        });
      } else {
        const newExpiresAt = existingLicense.expiresAt.getTime() > now.getTime()
          ? new Date(existingLicense.expiresAt.getTime() + payment.plan.durationDays * 24 * 60 * 60 * 1000)
          : expiresAt;

        const signedPayload = await signLicensePayload({
          ...basePayload,
          key: existingLicense.key.key,
          expiresAt: newExpiresAt.toISOString(),
        });

        await prisma.license.update({
          where: { id: existingLicense.id },
          data: {
            expiresAt: newExpiresAt,
            signedPayload,
          },
        });
      }

      await prisma.notification.create({
        data: {
          userId: payment.userId,
          type: "LICENSE_APPROVED",
          title: "Licença Aprovada",
          message: `O seu pagamento para o plano "${payment.plan.name}" foi aprovado. A sua licença está agora ativa.`,
        },
      });
    } else if (status === "REJECTED") {
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          type: "LICENSE_REJECTED",
          title: "Pagamento Rejeitado",
          message: `O seu pagamento para o plano "${payment.plan.name}" foi rejeitado.${adminNote ? ` Motivo: ${adminNote}` : ""}`,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Admin Payment PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
