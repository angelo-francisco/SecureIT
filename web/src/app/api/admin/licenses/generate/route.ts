import { NextResponse } from "next/server";
import { db } from "@/db";
import { licenseKey } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth";
import { generateLicenseKey } from "@/lib/license-key";

const TYPE_DEFAULTS: Record<string, { maxCameras: number; maxPeople: number }> = {
  TRIAL: { maxCameras: 1, maxPeople: 10 },
  STANDARD: { maxCameras: -1, maxPeople: -1 },
};

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const {
      type,
      durationDays,
      quantity,
      batchName,
      maxCameras,
      maxPeople,
    } = (await request.json()) as any;

    if (!type || !durationDays || !quantity) {
      return NextResponse.json(
        { error: "Tipo, duração e quantidade são obrigatórios" },
        { status: 400 }
      );
    }

    if (!["TRIAL", "STANDARD"].includes(type)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    if (quantity > 100) {
      return NextResponse.json(
        { error: "Máximo 100 licenças por vez" },
        { status: 400 }
      );
    }

    const defaults = TYPE_DEFAULTS[type] || { maxCameras: -1, maxPeople: -1 };
    const finalMaxCameras = maxCameras ?? defaults.maxCameras;
    const finalMaxPeople = maxPeople ?? defaults.maxPeople;

    const licenses = [];
    for (let i = 0; i < quantity; i++) {
      let key = generateLicenseKey();
      let exists = true;

      while (exists) {
        const existing = await db.select().from(licenseKey).where(eq(licenseKey.key, key)).get();
        if (!existing) {
          exists = false;
        } else {
          key = generateLicenseKey();
        }
      }

      const created = await db
        .insert(licenseKey)
        .values({
          key,
          type,
          durationDays,
          maxCameras: finalMaxCameras,
          maxPeople: finalMaxPeople,
          batchName: batchName || null,
        })
        .returning()
        .get();

      licenses.push({
        id: created.id,
        key: created.key,
        type: created.type,
        durationDays: created.durationDays,
        maxCameras: created.maxCameras,
        maxPeople: created.maxPeople,
        batchName: created.batchName,
        createdAt: created.createdAt,
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
