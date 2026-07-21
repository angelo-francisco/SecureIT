import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { licenseId, machineHash } = (await request.json()) as any;

    if (!licenseId) {
      return NextResponse.json(
        { error: "ID da licença é obrigatório" },
        { status: 400 }
      );
    }

    const license = await prisma.license.findUnique({
      where: { id: licenseId },
      include: { key: true, user: true },
    });

    if (!license) {
      return NextResponse.json(
        { error: "Licença não encontrada" },
        { status: 404 }
      );
    }

    if (license.key.status === "REVOKED") {
      return NextResponse.json({
        valid: false,
        error: "Licença revogada",
        isActive: false,
      });
    }

    const isActive = license.expiresAt > new Date();

    await prisma.license.update({
      where: { id: licenseId },
      data: { lastChecked: new Date() },
    });

    return NextResponse.json({
      valid: isActive,
      expiresAt: license.expiresAt,
      activatedAt: license.activatedAt,
      type: license.key.type,
      isActive,
      daysRemaining: Math.max(
        0,
        Math.ceil(
          (license.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      ),
      user: {
        email: license.user.email,
        firstName: license.user.firstName,
        lastName: license.user.lastName,
      },
    });
  } catch (error) {
    console.error("[License Validate]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
