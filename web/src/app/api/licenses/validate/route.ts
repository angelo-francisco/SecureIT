import { NextResponse } from "next/server";
import { db } from "@/db";
import { license, licenseKey, user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { licenseId, email, hardwareFp } = (await request.json()) as any;

    let lic: typeof license.$inferSelect | undefined = undefined;
    let keyData: typeof licenseKey.$inferSelect | undefined = undefined;
    let userData: typeof user.$inferSelect | undefined = undefined;

    if (licenseId) {
      lic = await db.select().from(license).where(eq(license.id, licenseId)).get();
      if (lic) {
        keyData = await db.select().from(licenseKey).where(eq(licenseKey.id, lic.keyId)).get();
        userData = await db.select().from(user).where(eq(user.id, lic.userId)).get();
      }
    } else if (email) {
      const foundUser = await db.select().from(user).where(eq(user.email, email)).get();
      if (foundUser) {
        lic = await db.select().from(license).where(eq(license.userId, foundUser.id)).get();
        if (lic) {
          keyData = await db.select().from(licenseKey).where(eq(licenseKey.id, lic.keyId)).get();
        }
        userData = foundUser;
      }
    }

    if (!lic || !keyData) {
      return NextResponse.json({
        valid: false,
        error: "Licença não encontrada",
        isActive: false,
      });
    }

    if (keyData.status === "REVOKED" || lic.status === "REVOKED") {
      return NextResponse.json({
        valid: false,
        error: "Licença revogada",
        isActive: false,
      });
    }

    if (hardwareFp && lic.hardwareFp && lic.hardwareFp !== hardwareFp) {
      return NextResponse.json({
        valid: false,
        error: "Fingerprint não corresponde",
        isActive: false,
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
      activatedAt: lic.activatedAt,
      type: keyData.type,
      isActive,
      signedPayload: lic.signedPayload,
      daysRemaining: Math.max(
        0,
        Math.ceil((expiresAtDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      ),
      user: userData
        ? { email: userData.email, firstName: userData.firstName, lastName: userData.lastName }
        : null,
    });
  } catch (error) {
    console.error("[License Validate]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
