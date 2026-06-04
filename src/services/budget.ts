import { prisma } from "@/lib/prisma";

export interface BudgetWithActuals {
  budget: {
    id: string;
    userId: string;
    categoryId: string;
    period: string;
    year: number;
    month: number | null;
    projectedAmount: number;
    currency: string;
    notes: string | null;
    category: {
      id: string;
      name: string;
      icon: string | null;
      color: string | null;
      type: string;
    };
  };
  actualSpending: number;
  variance: number;
  variancePct: number;
  progressPct: number;
}

export interface BudgetSummary {
  totalProjected: number;
  totalActual: number;
  totalVariance: number;
  overBudgetCount: number;
}

export async function getBudgetsWithActuals(
  userId: string,
  _baseCurrency: string,
  year: number,
  month?: number
): Promise<BudgetWithActuals[]> {
  const period = month ? "MONTHLY" : "ANNUAL";

  const budgets = await prisma.budget.findMany({
    where: {
      userId,
      period,
      year,
      ...(month ? { month } : {}),
    },
    include: { category: true },
  });

  const results: BudgetWithActuals[] = [];

  for (const budget of budgets) {
    // Build date range for transaction query
    let dateGte: Date;
    let dateLte: Date;

    if (period === "MONTHLY" && month) {
      dateGte = new Date(year, month - 1, 1);
      dateLte = new Date(year, month, 0, 23, 59, 59, 999);
    } else {
      dateGte = new Date(year, 0, 1);
      dateLte = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    const agg = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId: budget.categoryId,
        type: "EXPENSE",
        date: { gte: dateGte, lte: dateLte },
      },
      _sum: { baseAmount: true },
    });

    const actualSpending = Number(agg._sum.baseAmount ?? 0);
    const projectedAmount = Number(budget.projectedAmount);
    const variance = projectedAmount - actualSpending;
    const variancePct = projectedAmount > 0 ? (variance / projectedAmount) * 100 : 0;
    const progressPct = projectedAmount > 0 ? Math.min((actualSpending / projectedAmount) * 100, 100) : 0;

    results.push({
      budget: {
        id: budget.id,
        userId: budget.userId,
        categoryId: budget.categoryId,
        period: budget.period,
        year: budget.year,
        month: budget.month,
        projectedAmount,
        currency: budget.currency,
        notes: budget.notes,
        category: {
          id: budget.category.id,
          name: budget.category.name,
          icon: budget.category.icon,
          color: budget.category.color,
          type: budget.category.type,
        },
      },
      actualSpending,
      variance,
      variancePct,
      progressPct,
    });
  }

  return results;
}

export async function getBudgetSummary(
  userId: string,
  baseCurrency: string,
  year: number,
  month?: number
): Promise<BudgetSummary> {
  const items = await getBudgetsWithActuals(userId, baseCurrency, year, month);

  const totalProjected = items.reduce((s, i) => s + i.budget.projectedAmount, 0);
  const totalActual = items.reduce((s, i) => s + i.actualSpending, 0);
  const totalVariance = totalProjected - totalActual;
  const overBudgetCount = items.filter((i) => i.variance < 0).length;

  return { totalProjected, totalActual, totalVariance, overBudgetCount };
}
