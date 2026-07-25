import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createToken, setTokenCookies } from "@/lib/auth";
import { generateId } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const { email, password, pin, firstName, lastName, phone } =
      (await request.json()) as any;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Campos obrigatórios em falta" },
        { status: 400 }
      );
    }

    if (password.length < 12) {
      return NextResponse.json(
        { error: "Palavra-passe deve ter pelo menos 12 caracteres" },
        { status: 400 }
      );
    }

    if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
      return NextResponse.json(
        { error: "O PIN deve conter 4 dígitos" },
        { status: 400 }
      );
    }

    const existing = await db.select().from(user).where(eq(user.email, email)).get();
    if (existing) {
      return NextResponse.json(
        { error: "Email já registado" },
        { status: 409 }
      );
    }

    const passwordHash = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 12,
    });
    const pinHash = pin
      ? await Bun.password.hash(pin, {
          algorithm: "bcrypt",
          cost: 12,
        })
      : null;

    const userId = generateId();
    const profileId = generateId();
    const now = new Date().toISOString();

    await db
      .insert(user)
      .values({
        id: userId,
        email,
        passwordHash,
        pinHash,
        firstName,
        lastName,
        phone: phone || null,
        createdAt: now,
      })
      .run();

    const { subProfile } = await import("@/db/schema");
    await db
      .insert(subProfile)
      .values({
        id: profileId,
        userId,
        name: firstName,
        avatarColor: "#2C9ED5",
        isDefault: true,
        createdAt: now,
      })
      .run();

    const createdUser = await db.select().from(user).where(eq(user.id, userId)).get();
    if (!createdUser) {
      return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
    }

    const accessToken = await createToken(
      { sub: createdUser.id, email: createdUser.email },
      "access"
    );
    const refreshToken = await createToken(
      { sub: createdUser.id, email: createdUser.email },
      "refresh"
    );

    const body = {
      access_token: accessToken,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        phone: createdUser.phone,
        totpEnabled: createdUser.totpEnabled,
        createdAt: createdUser.createdAt,
      },
    };

    const baseResponse = NextResponse.json(body);
    const response = setTokenCookies(baseResponse, accessToken, refreshToken);

    return response;
  } catch (error) {
    console.error("[Signup]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
