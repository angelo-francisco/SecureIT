import { db } from "@/db";
import { maintenanceRequest, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  try {
    const rows = await db
      .select()
      .from(maintenanceRequest)
      .orderBy(desc(maintenanceRequest.createdAt))
      .all();

    const result = await Promise.all(
      rows.map(async (r) => {
        const u = await db.select().from(user).where(eq(user.id, r.userId)).get();
        return {
          ...r,
          user: u
            ? { firstName: u.firstName, lastName: u.lastName, email: u.email }
            : null,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Admin Maintenance GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
