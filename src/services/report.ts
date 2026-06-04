import { prisma } from "@/lib/prisma";
import { convert } from "@/services/currency";

export interface CategoryBreakdown {
  category: string;
  amount: number;
  pct: number;
}

export interface ReportData {
  periodStart: string;
  periodEnd: string;
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
  topCategories: CategoryBreakdown[];
  netWorthStart: number | null;
  netWorthEnd: number | null;
  totalDebt: number;
  transactionCount: number;
  currency: string;
}

export async function generateReportData(
  userId: string,
  baseCurrency: string,
  periodStart: Date,
  periodEnd: Date
): Promise<ReportData> {
  const [transactions, snapshots, liabilities] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: periodStart, lte: periodEnd },
        type: { in: ["INCOME", "EXPENSE"] },
      },
      include: { category: true },
    }),
    prisma.netWorthSnapshot.findMany({
      where: {
        userId,
        snapshotDate: {
          gte: new Date(periodStart.getTime() - 7 * 24 * 60 * 60 * 1000),
          lte: new Date(periodEnd.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { snapshotDate: "asc" },
    }),
    prisma.liability.findMany({ where: { userId } }),
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;
  const catTotals: Record<string, number> = {};

  for (const tx of transactions) {
    let amount = Number(tx.baseAmount ?? tx.amount);
    if (!tx.baseAmount && tx.currency !== baseCurrency) {
      try {
        const r = await convert(Number(tx.amount), tx.currency, baseCurrency, tx.date);
        amount = r.amount;
      } catch {
        amount = Number(tx.amount);
      }
    }

    if (tx.type === "INCOME") {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
      const catName = tx.category?.name ?? "Other";
      catTotals[catName] = (catTotals[catName] ?? 0) + amount;
    }
  }

  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  const topCategories: CategoryBreakdown[] = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category, amount]) => ({
      category,
      amount,
      pct: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }));

  // NW snapshots closest to start and end
  const nwStart = snapshots.length > 0 ? Number(snapshots[0].netWorth) : null;
  const nwEnd = snapshots.length > 0 ? Number(snapshots[snapshots.length - 1].netWorth) : null;

  let totalDebt = 0;
  for (const l of liabilities) {
    let val = Number(l.balance);
    if (l.currency !== baseCurrency) {
      try {
        const r = await convert(val, l.currency, baseCurrency);
        val = r.amount;
      } catch {
        // use original
      }
    }
    totalDebt += val;
  }

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    totalIncome,
    totalExpenses,
    savings,
    savingsRate,
    topCategories,
    netWorthStart: nwStart,
    netWorthEnd: nwEnd,
    totalDebt,
    transactionCount: transactions.length,
    currency: baseCurrency,
  };
}

export async function generateCSV(
  userId: string,
  baseCurrency: string,
  periodStart: Date,
  periodEnd: Date
): Promise<string> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: periodStart, lte: periodEnd },
    },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  const header = "Date,Type,Description,Merchant,Amount,Currency,Base Amount,Category\n";
  const rows = transactions.map((tx) => {
    const cols = [
      tx.date.toISOString().slice(0, 10),
      tx.type,
      `"${(tx.description ?? "").replace(/"/g, '""')}"`,
      `"${(tx.merchant ?? "").replace(/"/g, '""')}"`,
      Number(tx.amount).toFixed(2),
      tx.currency,
      tx.baseAmount ? Number(tx.baseAmount).toFixed(2) : "",
      `"${tx.category?.name ?? ""}"`,
    ];
    return cols.join(",");
  });

  return header + rows.join("\n");
}
