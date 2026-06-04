import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLatestRates, fetchAndStoreRates } from "@/services/currency";

// GET /api/exchange-rates?base=COP
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const base = req.nextUrl.searchParams.get("base") ??
    (session.user as any).baseCurrency ?? "COP";

  const rates = await getLatestRates(base);
  return NextResponse.json({ base, rates });
}

// POST /api/exchange-rates/sync — trigger manual rate sync
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await fetchAndStoreRates();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[exchange-rates sync]", error);
    return NextResponse.json({ error: "Rate sync failed" }, { status: 500 });
  }
}
