import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { token } = (await request.json()) as { token?: string };
		if (!token) return NextResponse.json({ success: false }, { status: 400 });

		const res = await fetch(
			"https://challenges.cloudflare.com/turnstile/v0/siteverify",
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					secret: process.env.TURNSTILE_SECRET_KEY,
					response: token,
				}),
			},
		);

		const data = (await res.json()) as { success: boolean };
		return NextResponse.json({ success: data.success });
	} catch {
		return NextResponse.json({ success: false }, { status: 500 });
	}
}
