import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  try {
    const license = await prisma.license.findUnique({
      where: { userId: session.sub },
      include: { key: true },
    });
    return NextResponse.json(license || null);
  } catch (error) {
    console.error("[License GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
