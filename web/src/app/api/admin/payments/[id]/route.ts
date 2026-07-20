import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { generateLicenseKey } from "@/lib/license-key";

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
    const body = await request.json();
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
      });

      if (!existingLicense) {
        let key = generateLicenseKey();
        let exists = true;
        while (exists) {
          const existing = await prisma.licenseKey.findUnique({ where: { key } });
          if (!existing) exists = false;
          else key = generateLicenseKey();
        }

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
          },
        });
      } else {
        const newExpiresAt = existingLicense.expiresAt.getTime() > now.getTime()
          ? new Date(existingLicense.expiresAt.getTime() + payment.plan.durationDays * 24 * 60 * 60 * 1000)
          : expiresAt;

        await prisma.license.update({
          where: { id: existingLicense.id },
          data: { expiresAt: newExpiresAt },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Admin Payment PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
