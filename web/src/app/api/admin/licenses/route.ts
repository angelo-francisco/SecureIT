import { NextResponse } from "next/server";
import { db } from "@/db";
import { licenseKey, license } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || undefined;

    const conditions = status ? eq(licenseKey.status, status) : undefined;

    const keys = await db
      .select()
      .from(licenseKey)
      .where(conditions)
      .orderBy(desc(licenseKey.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)
      .all();

    const countResult = await db.all<{ count: number }>(
      sql`SELECT count(*) as "count" FROM ${licenseKey}${conditions ? sql` WHERE ${conditions}` : sql``}`
    );

    const total = Number(countResult?.[0]?.count ?? 0);

    const keysWithLicenses = await Promise.all(
      keys.map(async (key) => {
        const lic = await db
          .select()
          .from(license)
          .where(eq(license.keyId, key.id))
          .get();

        return {
          ...key,
          license: lic || null,
        };
      })
    );

    return NextResponse.json({
      licenses: keysWithLicenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Admin List Licenses]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
