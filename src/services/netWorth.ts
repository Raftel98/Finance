import { prisma } from "@/lib/prisma";
import { convert } from "@/services/currency";

export interface NetWorthBreakdown {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  currency: string;
  assetBreakdown: Record<string, number>;
  liabilityBreakdown: Record<string, number>;
  currencyBreakdown: Record<string, { assets: number; liabilities: number }>;
}

export async function calculateNetWorth(
  userId: string,
  baseCurrency: string
): Promise<NetWorthBreakdown> {
  const [assets, liabilities] = await Promise.all([
    prisma.asset.findMany({ where: { userId } }),
    prisma.liability.findMany({ where: { userId } }),
  ]);

  const assetBreakdown: Record<string, number> = {};
  const liabilityBreakdown: Record<string, number> = {};
  const currencyBreakdown: Record<string, { assets: number; liabilities: number }> = {};

  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const asset of assets) {
    let value = Number(asset.currentValue);
    if (asset.currency !== baseCurrency) {
      try {
        const result = await convert(value, asset.currency, baseCurrency);
        value = result.amount;
      } catch {
        // use original if conversion fails
      }
    }
    totalAssets += value;
    assetBreakdown[asset.type] = (assetBreakdown[asset.type] ?? 0) + value;

    if (!currencyBreakdown[asset.currency]) {
      currencyBreakdown[asset.currency] = { assets: 0, liabilities: 0 };
    }
    currencyBreakdown[asset.currency].assets += Number(asset.currentValue);
  }

  for (const liability of liabilities) {
    let value = Number(liability.balance);
    if (liability.currency !== baseCurrency) {
      try {
        const result = await convert(value, liability.currency, baseCurrency);
        value = result.amount;
      } catch {
        // use original if conversion fails
      }
    }
    totalLiabilities += value;
    liabilityBreakdown[liability.type] = (liabilityBreakdown[liability.type] ?? 0) + value;

    if (!currencyBreakdown[liability.currency]) {
      currencyBreakdown[liability.currency] = { assets: 0, liabilities: 0 };
    }
    currencyBreakdown[liability.currency].liabilities += Number(liability.balance);
  }

  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    currency: baseCurrency,
    assetBreakdown,
    liabilityBreakdown,
    currencyBreakdown,
  };
}

export async function createSnapshot(userId: string, baseCurrency: string) {
  const data = await calculateNetWorth(userId, baseCurrency);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const snapshot = await prisma.netWorthSnapshot.upsert({
    where: {
      userId_snapshotDate: {
        userId,
        snapshotDate: today,
      },
    },
    create: {
      userId,
      snapshotDate: today,
      totalAssets: data.totalAssets,
      totalLiabilities: data.totalLiabilities,
      netWorth: data.netWorth,
      currency: baseCurrency,
      assetBreakdown: data.assetBreakdown,
      liabilityBreakdown: data.liabilityBreakdown,
      currencyBreakdown: data.currencyBreakdown,
    },
    update: {
      totalAssets: data.totalAssets,
      totalLiabilities: data.totalLiabilities,
      netWorth: data.netWorth,
      currency: baseCurrency,
      assetBreakdown: data.assetBreakdown,
      liabilityBreakdown: data.liabilityBreakdown,
      currencyBreakdown: data.currencyBreakdown,
    },
  });

  return snapshot;
}

export async function getNetWorthHistory(userId: string, months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return prisma.netWorthSnapshot.findMany({
    where: {
      userId,
      snapshotDate: { gte: since },
    },
    orderBy: { snapshotDate: "asc" },
  });
}
