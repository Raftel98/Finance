import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateForecast } from "@/services/forecast";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user!.id!;
  const baseCurrency = (session.user as any).baseCurrency ?? "COP";

  const { searchParams } = new URL(req.url);
  const months = Math.min(Number(searchParams.get("months") ?? "12"), 36);
  const scenarioId = searchParams.get("scenarioId") ?? undefined;

  const projections = await generateForecast(userId, baseCurrency, months, scenarioId);
  return NextResponse.json({ projections });
}
