import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/api/auth", "/api/licenses/validate", "/api/licenses/activate"];

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:1420",
  "http://localhost:5173",
  "http://localhost:5174",
  "file://",
  "electron://",
  "tauri://",
];

function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = ALLOWED_ORIGINS.some((o) => origin.startsWith(o)) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

function applyCors(response: NextResponse, headers: Record<string, string>) {
  for (const [k, v] of Object.entries(headers)) {
    response.headers.set(k, v);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const corsHeaders = getCorsHeaders(request);

  if (pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }

    if (pathname.startsWith("/api/admin/")) {
      const token = request.cookies.get("admin_token")?.value;
      if (!token) {
        const res = NextResponse.json({ error: "Não autenticado" }, { status: 401 });
        return applyCors(res, corsHeaders);
      }
      const { verifyAccessToken } = await import("@/lib/auth");
      const payload = await verifyAccessToken(token);
      if (!payload) {
        const res = NextResponse.json({ error: "Token inválido" }, { status: 401 });
        return applyCors(res, corsHeaders);
      }
      const response = NextResponse.next();
      return applyCors(response, corsHeaders);
    }

    const response = NextResponse.next();
    return applyCors(response, corsHeaders);
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const REDIRECT_WHEN_AUTHED = ["/", "/login", "/signup"];
    if (REDIRECT_WHEN_AUTHED.some((p) => pathname === p || pathname === p + "/")) {
      const token = request.cookies.get("token")?.value;
      if (token) {
        const { verifyAccessToken } = await import("@/lib/auth");
        const payload = await verifyAccessToken(token);
        if (payload) {
          return NextResponse.redirect(new URL("/my-account", request.url));
        }
      }
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const { verifyAccessToken } = await import("@/lib/auth");
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { verifyAccessToken } = await import("@/lib/auth");
  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
