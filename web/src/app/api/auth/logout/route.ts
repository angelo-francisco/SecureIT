import { NextResponse } from "next/server";
import { clearTokenCookies } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  return clearTokenCookies(response);
}
