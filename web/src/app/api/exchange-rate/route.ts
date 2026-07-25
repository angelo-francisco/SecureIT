import { NextResponse } from "next/server";

let cachedRate: number | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000;
const FALLBACK_RATE = 832.50;

export async function GET() {
  try {
    if (cachedRate && Date.now() - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json({ rate: cachedRate, cached: true });
    }

    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error("Exchange API failed");

    const data = (await res.json()) as { rates?: { AOA?: number } };
    const aoaRate = data?.rates?.AOA;

    if (typeof aoaRate === "number" && aoaRate > 0) {
      cachedRate = aoaRate;
      cacheTimestamp = Date.now();
      return NextResponse.json({ rate: aoaRate, cached: false });
    }

    throw new Error("AOA rate not found in response");
  } catch (error) {
    console.error("[Exchange Rate]", error);
    return NextResponse.json({ rate: cachedRate || FALLBACK_RATE, cached: true, fallback: true });
  }
}
