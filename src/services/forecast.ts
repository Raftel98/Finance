import { prisma } from "@/lib/prisma";
import { convert } from "@/services/currency";

export interface MonthProjection {
  month: string; // "2026-07"
  projectedIncome: number;
  projectedExpenses: number;
  cashFlow: number;
  cumulativeSavings: number;
  projectedNetWorth: number;
  projectedDebt: number;
}

function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function ruleAppliesInMonth(
  rule: {
    frequency: string;
    startDate: Date;
    endDate: Date | null;
    dayOfMonth: number | null;
  },
  monthDate: Date // first day of the month
): boolean {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

  // Rule must have started by end of month
  if (rule.startDate > monthEnd) return false;
  // Rule must not have ended before start of month
  if (rule.endDate && rule.endDate < monthStart) return false;

  switch (rule.frequency) {
    case "DAILY":
    case "WEEKLY":
    case "MONTHLY":
      return true;
    case "YEARLY": {
      // Only applies in months where startDate's month matches
      return rule.startDate.getMonth() === monthDate.getMonth();
    }
    default:
      return true;
  }
}

export async function generateForecast(
  userId: string,
  baseCurrency: string,
  months = 12,
  scenarioId?: string
): Promise<MonthProjection[]> {
  const [rules, latestSnapshot, liabilities, scenario] = await Promise.all([
    prisma.recurringRule.findMany({ where: { userId, isActive: true } }),
    prisma.netWorthSnapshot.findFirst({
      where: { userId },
      orderBy: { snapshotDate: "desc" },
    }),
    prisma.liability.findMany({ where: { userId } }),
    scenarioId
      ? prisma.forecastScenario.findFirst({
          where: { id: scenarioId, userId },
          include: { adjustments: true },
        })
      : null,
  ]);

  const baseNetWorth = latestSnapshot ? Number(latestSnapshot.netWorth) : 0;
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

  const projections: MonthProjection[] = [];
  let cumulativeSavings = 0;

  const today = new Date();

  for (let i = 1; i <= months; i++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);

    let projectedIncome = 0;
    let projectedExpenses = 0;

    for (const rule of rules) {
      if (!ruleAppliesInMonth(rule, monthDate)) continue;
      let amount = Number(rule.amount);
      if (rule.currency !== baseCurrency) {
        try {
          const r = await convert(amount, rule.currency, baseCurrency);
          amount = r.amount;
        } catch {
          // use original
        }
      }
      if (rule.type === "INCOME") projectedIncome += amount;
      else projectedExpenses += amount;
    }

    // Apply scenario adjustments
    if (scenario?.adjustments) {
      for (const adj of scenario.adjustments) {
        const adjStart = new Date(adj.startDate);
        const adjEnd = adj.endDate ? new Date(adj.endDate) : null;
        const mStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const mEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

        if (adjStart > mEnd) continue;
        if (adjEnd && adjEnd < mStart) continue;

        let impact = 0;
        if (adj.impactAmount !== null && adj.impactAmount !== undefined) {
          let amt = Number(adj.impactAmount);
          if (adj.currency && adj.currency !== baseCurrency) {
            try {
              const r = await convert(amt, adj.currency, baseCurrency);
              amt = r.amount;
            } catch {
              // use original
            }
          }
          impact = amt;
        }

        switch (adj.adjustmentType) {
          case "INCOME_CHANGE":
            if (adj.impactPercent) {
              projectedIncome *= 1 + Number(adj.impactPercent) / 100;
            } else {
              projectedIncome += impact;
            }
            break;
          case "EXPENSE_CHANGE":
            if (adj.impactPercent) {
              projectedExpenses *= 1 + Number(adj.impactPercent) / 100;
            } else {
              projectedExpenses += impact;
            }
            break;
          case "NEW_EXPENSE":
            projectedExpenses += impact;
            break;
          case "ASSET_CHANGE":
          case "DEBT_CHANGE":
            // These affect NW directly, not cash flow
            break;
        }
      }
    }

    const cashFlow = projectedIncome - projectedExpenses;
    cumulativeSavings += cashFlow;

    projections.push({
      month: monthKey(monthDate),
      projectedIncome,
      projectedExpenses,
      cashFlow,
      cumulativeSavings,
      projectedNetWorth: baseNetWorth + cumulativeSavings,
      projectedDebt: totalDebt,
    });
  }

  return projections;
}
