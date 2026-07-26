import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyRefreshToken, createToken } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
	try {
		const cookieStore = await cookies();
		const refreshToken = cookieStore.get("refresh_token")?.value;

		if (!refreshToken) {
			return NextResponse.json({ error: "Sem refresh token" }, { status: 401 });
		}

		const payload = await verifyRefreshToken(refreshToken);
		if (!payload) {
			return NextResponse.json(
				{ error: "Refresh token inválido" },
				{ status: 401 },
			);
		}

		if (payload.sub === "admin") {
			const newAccessToken = await createToken(
				{ sub: "admin", email: payload.email },
				"access",
			);
			const response = NextResponse.json({ access_token: newAccessToken });
			response.cookies.set("admin_token", newAccessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
				maxAge: 24 * 60 * 60,
				path: "/",
			});
			return response;
		}

		const foundUser = await db
			.select()
			.from(user)
			.where(eq(user.id, payload.sub))
			.get();
		if (!foundUser || !foundUser.isActive) {
			return NextResponse.json({ error: "Conta desativada" }, { status: 401 });
		}

		const newAccessToken = await createToken(
			{ sub: payload.sub, email: payload.email },
			"access",
		);
		const newRefreshToken = await createToken(
			{ sub: payload.sub, email: payload.email },
			"refresh",
		);

		const response = NextResponse.json({ access_token: newAccessToken });

		response.cookies.set("token", newAccessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 30 * 24 * 60 * 60,
			path: "/",
		});

		response.cookies.set("refresh_token", newRefreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 90 * 24 * 60 * 60,
			path: "/",
		});

		return response;
	} catch (error) {
		console.error("[Refresh]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
