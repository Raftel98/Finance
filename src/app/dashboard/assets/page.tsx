import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/ui/PageShell";
import { AssetsClient } from "@/components/modules/assets/AssetsClient";
import { convert } from "@/services/currency";

export const metadata: Metadata = { title: "Assets" };

export default async function AssetsPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const baseCurrency = (session!.user as any).baseCurrency ?? "COP";

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
        purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString() : null,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString(),
      };
    })
  );

  return (
    <PageShell title="Assets">
      <AssetsClient
        initialData={{
          assets: enriched as any,
          totals: { totalAssets, totalLiquid, currency: baseCurrency },
        }}
        baseCurrency={baseCurrency}
      />
    </PageShell>
  );
}
