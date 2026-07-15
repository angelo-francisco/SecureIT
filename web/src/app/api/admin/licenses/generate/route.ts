import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generateLicenseKey } from "@/lib/license-key";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const { type, durationDays, quantity, batchName } = await request.json();

    if (!type || !durationDays || !quantity) {
      return NextResponse.json(
        { error: "Tipo, duração e quantidade são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["TRIAL", "STANDARD"].includes(type)) {
      return NextResponse.json(
        { error: "Tipo inválido" },
        { status: 400 }
      );
    }

    if (quantity > 100) {
      return NextResponse.json(
        { error: "Máximo 100 licenças por vez" },
        { status: 400 }
      );
    }

    const licenses = [];
    for (let i = 0; i < quantity; i++) {
      let key = generateLicenseKey();
      let exists = true;

      while (exists) {
        const existing = await prisma.licenseKey.findUnique({
          where: { key },
        });
        if (!existing) {
          exists = false;
        } else {
          key = generateLicenseKey();
        }
      }

      const license = await prisma.licenseKey.create({
        data: {
          key,
          type,
          durationDays,
          batchName: batchName || null,
        },
      });

      licenses.push({
        id: license.id,
        key: license.key,
        type: license.type,
        durationDays: license.durationDays,
        batchName: license.batchName,
        createdAt: license.createdAt,
      });
    }

    return NextResponse.json({ licenses, count: licenses.length });
  } catch (error) {
    console.error("[Admin Generate Licenses]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
