import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSnapshot, getNetWorthHistory } from "@/services/netWorth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user!.id!;
  const baseCurrency = (session.user as any).baseCurrency ?? "COP";

  const history = await getNetWorthHistory(userId, 12);

  const current = history.length > 0 ? history[history.length - 1] : null;
  const previous = history.length > 1 ? history[history.length - 2] : null;

  const momChange =
    current && previous
      ? Number(current.netWorth) - Number(previous.netWorth)
      : null;
  const momChangePct =
    momChange != null && previous && Number(previous.netWorth) !== 0
      ? (momChange / Math.abs(Number(previous.netWorth))) * 100
      : null;

  return NextResponse.json({
    current: current
      ? {
          ...current,
          totalAssets: Number(current.totalAssets),
          totalLiabilities: Number(current.totalLiabilities),
          netWorth: Number(current.netWorth),
          momChange,
          momChangePct,
        }
      : null,
    history: history.map((s) => ({
      ...s,
      totalAssets: Number(s.totalAssets),
      totalLiabilities: Number(s.totalLiabilities),
      netWorth: Number(s.netWorth),
    })),
    baseCurrency,
  });
}

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user!.id!;
  const baseCurrency = (session.user as any).baseCurrency ?? "COP";

  const snapshot = await createSnapshot(userId, baseCurrency);
  return NextResponse.json(
    {
      ...snapshot,
      totalAssets: Number(snapshot.totalAssets),
      totalLiabilities: Number(snapshot.totalLiabilities),
      netWorth: Number(snapshot.netWorth),
    },
    { status: 201 }
  );
}
