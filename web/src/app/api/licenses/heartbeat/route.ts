import { NextResponse } from "next/server";
import { db } from "@/db";
import { license, licenseKey, user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { licenseId, email, hardwareFp } = (await request.json()) as any;

    let lic: typeof license.$inferSelect | undefined = undefined;
    let keyData: typeof licenseKey.$inferSelect | undefined = undefined;

    if (licenseId) {
      lic = await db.select().from(license).where(eq(license.id, licenseId)).get();
      if (lic) {
        keyData = await db.select().from(licenseKey).where(eq(licenseKey.id, lic.keyId)).get();
      }
    } else if (email) {
      const foundUser = await db.select().from(user).where(eq(user.email, email)).get();
      if (foundUser) {
        lic = await db.select().from(license).where(eq(license.userId, foundUser.id)).get();
        if (lic) {
          keyData = await db.select().from(licenseKey).where(eq(licenseKey.id, lic.keyId)).get();
        }
      }
    }

    if (!lic || !keyData) {
      return NextResponse.json({
        valid: false,
        error: "Licença não encontrada",
        revoked: false,
      });
    }

    if (keyData.status === "REVOKED" || lic.status === "REVOKED") {
      return NextResponse.json({
        valid: false,
        error: "Licença revogada",
        revoked: true,
        isActive: false,
        daysRemaining: 0,
      });
    }

    if (hardwareFp && lic.hardwareFp && lic.hardwareFp !== hardwareFp) {
      return NextResponse.json({
        valid: false,
        error: "Fingerprint não corresponde",
        revoked: false,
        isActive: false,
        daysRemaining: 0,
      });
    }

    const expiresAtDate = new Date(lic.expiresAt);
    const isActive = expiresAtDate > new Date();

    await db
      .update(license)
      .set({ lastChecked: new Date().toISOString() })
      .where(eq(license.id, lic.id))
      .run();

    return NextResponse.json({
      valid: isActive,
      expiresAt: lic.expiresAt,
      type: keyData.type,
      isActive,
      revoked: false,
      daysRemaining: Math.max(
        0,
        Math.ceil((expiresAtDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
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
