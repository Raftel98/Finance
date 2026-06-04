import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assetSchema } from "@/lib/validations/asset";
import { convert } from "@/services/currency";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user!.id!;
  const baseCurrency = session.user.baseCurrency ?? "COP";

  const assets = await prisma.asset.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  let totalAssets = 0;
  let totalLiquid = 0;

  const enriched = await Promise.all(
    assets.map(async (asset) => {
      let baseValue = Number(asset.currentValue);
      let exchangeRate = 1;
      if (asset.currency !== baseCurrency) {
        try {
          const r = await convert(baseValue, asset.currency, baseCurrency);
          baseValue = r.amount;
          exchangeRate = r.rate;
        } catch {}
      }
      totalAssets += baseValue;
      if (asset.isLiquid) totalLiquid += baseValue;

      const purchaseValue = asset.purchaseValue ? Number(asset.purchaseValue) : null;
      const unrealizedGain =
        purchaseValue != null ? Number(asset.currentValue) - purchaseValue : null;
      const unrealizedGainPct =
        purchaseValue != null && purchaseValue > 0
          ? ((Number(asset.currentValue) - purchaseValue) / purchaseValue) * 100
          : null;

      return {
        ...asset,
        currentValue: Number(asset.currentValue),
        purchaseValue,
        baseValue,
        exchangeRate,
        unrealizedGain,
        unrealizedGainPct,
      };
    })
  );

  return NextResponse.json({
    assets: enriched,
    totals: {
      totalAssets,
      totalLiquid,
      currency: baseCurrency,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user!.id!;

  const body = await req.json();
  const parsed = assetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { purchaseDate, ...rest } = parsed.data;

  const asset = await prisma.asset.create({
    data: {
      ...rest,
      userId,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
    },
  });

  return NextResponse.json(asset, { status: 201 });
}
