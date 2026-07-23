import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { licenseId, email, hardwareFp } = (await request.json()) as any;

    let license = null;

    if (licenseId) {
      license = await prisma.license.findUnique({
        where: { id: licenseId },
        include: { key: true },
      });
    } else if (email) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        license = await prisma.license.findUnique({
          where: { userId: user.id },
          include: { key: true },
        });
      }
    }

    if (!license) {
      return NextResponse.json({
        valid: false,
        error: "Licença não encontrada",
        revoked: false,
      });
    }

    if (license.key.status === "REVOKED" || license.status === "REVOKED") {
      return NextResponse.json({
        valid: false,
        error: "Licença revogada",
        revoked: true,
        isActive: false,
        daysRemaining: 0,
      });
    }

    if (hardwareFp && license.hardwareFp && license.hardwareFp !== hardwareFp) {
      return NextResponse.json({
        valid: false,
        error: "Fingerprint não corresponde",
        revoked: false,
        isActive: false,
        daysRemaining: 0,
      });
    }

    const isActive = license.expiresAt > new Date();

    await prisma.license.update({
      where: { id: license.id },
      data: { lastChecked: new Date() },
    });

    return NextResponse.json({
      valid: isActive,
      expiresAt: license.expiresAt,
      type: license.key.type,
      isActive,
      revoked: false,
      daysRemaining: Math.max(
        0,
        Math.ceil(
          (license.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      ),
    });
  } catch (error) {
    console.error("[License Heartbeat]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
