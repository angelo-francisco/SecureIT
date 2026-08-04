import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

cloudinary.config({
	cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
	api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const body = (await request.json()) as {
			paramsToSign: Record<string, string>;
		};
		const { paramsToSign } = body;

		const signature = cloudinary.utils.api_sign_request(
			paramsToSign,
			process.env.CLOUDINARY_API_SECRET ?? "",
		);

		return NextResponse.json({ signature });
	} catch (error) {
		console.error("[Cloudinary Sign]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
