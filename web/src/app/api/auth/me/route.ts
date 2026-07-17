import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, createToken } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      include: { license: { include: { key: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
    }

    const token = await createToken({ sub: user.id, email: user.email });

    return NextResponse.json({
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        totpEnabled: user.totpEnabled,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      license: user.license
        ? {
            id: user.license.id,
            type: user.license.key.type,
            activatedAt: user.license.activatedAt,
            expiresAt: user.license.expiresAt,
            lastChecked: user.license.lastChecked,
            isActive: user.license.expiresAt > new Date(),
            daysRemaining: Math.max(
              0,
              Math.ceil(
                (user.license.expiresAt.getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )
            ),
          }
        : null,
    });
  } catch (error) {
    console.error("[Me]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
