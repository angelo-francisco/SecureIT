import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

const PROFILE_LIMITS: Record<string, number> = {
  basic: 2,
  pro: 5,
  enterprise: 10,
};

export async function GET(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const profiles = await prisma.subProfile.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        avatarColor: true,
        isDefault: true,
        createdAt: true,
        pinHash: true,
      },
    });
    return NextResponse.json(
      profiles.map((p) => ({
        id: p.id,
        name: p.name,
        avatarColor: p.avatarColor,
        isDefault: p.isDefault,
        createdAt: p.createdAt,
        hasPin: !!p.pinHash,
      }))
    );
  } catch (error) {
    console.error("[Profiles GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as any;
    const { name, avatarColor, pin } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
    }

    if (pin && (typeof pin !== "string" || !/^\d{4}$/.test(pin))) {
      return NextResponse.json({ error: "O PIN deve conter 4 dígitos" }, { status: 400 });
    }

    const count = await prisma.subProfile.count({
      where: { userId: session.sub },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      include: { license: { include: { key: true } } },
    });

    const licenseType = user?.license?.key?.type?.toLowerCase() ?? "basic";
    const maxProfiles = PROFILE_LIMITS[licenseType] ?? 2;

    if (count >= maxProfiles) {
      return NextResponse.json(
        { error: `Máximo de ${maxProfiles} perfis para o plano ${licenseType}` },
        { status: 400 }
      );
    }

    const profile = await prisma.subProfile.create({
      data: {
        userId: session.sub,
        name: name.trim(),
        avatarColor: avatarColor || "#2C9ED5",
        pinHash: pin ? await Bun.password.hash(pin, {
  algorithm: "bcrypt",
  cost: 12
}); : null,
      },
    });

    return NextResponse.json({
      id: profile.id,
      name: profile.name,
      avatarColor: profile.avatarColor,
      isDefault: profile.isDefault,
      hasPin: !!profile.pinHash,
    });
  } catch (error) {
    console.error("[Profiles POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
