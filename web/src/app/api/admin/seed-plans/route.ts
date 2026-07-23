import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function POST() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  try {
    const existing = await prisma.plan.findFirst();
    if (existing) {
      return NextResponse.json({ message: "Planos já existem", plans: await prisma.plan.findMany({ include: { features: true, services: true } }) });
    }

    const b2c = await prisma.plan.create({
      data: {
        name: "B2C",
        description: "Plano para utilizadores individuais",
        basePrice: 75.25,
        currency: "USD",
        durationDays: 30,
        isDefault: true,
        features: {
          create: [
            { name: "Análise Comportamental", description: "Análise avançada de comportamento em tempo real", price: 0 },
            { name: "Cloud Storage", description: "Armazenamento de gravações na cloud", price: 0 },
            { name: "Tunnel de Acesso Remoto", description: "Acesso remoto seguro às suas câmeras", price: 0 },
          ],
        },
        services: {
          create: [
            { name: "Instalação e Configuração", description: "Instalação profissional do sistema", price: 12 },
          ],
        },
      },
      include: { features: true, services: true },
    });

    const b2b = await prisma.plan.create({
      data: {
        name: "B2B",
        description: "Plano para empresas e negócios",
        basePrice: 81.27,
        currency: "USD",
        durationDays: 30,
        features: {
          create: [
            { name: "Análise Comportamental", description: "Análise avançada de comportamento em tempo real", price: 0 },
            { name: "Cloud Storage", description: "Armazenamento de gravações na cloud", price: 0 },
            { name: "Tunnel de Acesso Remoto", description: "Acesso remoto seguro às suas câmeras", price: 0 },
          ],
        },
        services: {
          create: [
            { name: "Instalação e Configuração", description: "Instalação profissional do sistema", price: 16 },
          ],
        },
      },
      include: { features: true, services: true },
    });

    return NextResponse.json({ message: "Planos criados com sucesso", plans: [b2c, b2b] });
  } catch (error) {
    console.error("[Seed Plans]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
