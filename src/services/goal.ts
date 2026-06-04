import { prisma } from "@/lib/prisma";

export interface GoalWithProgress {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currency: string;
  deadline: string | null;
  currentAmount: number;
  computedAmount: number;
  trackingType: string;
  assetId: string | null;
  notes: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  progressPct: number;
  projectedCompletionDate: string | null;
}

export async function computeGoalProgress(
  goal: {
    id: string;
    trackingType: string;
    assetId: string | null;
    currentAmount: { toNumber: () => number } | number;
    targetAmount: { toNumber: () => number } | number;
    createdAt?: Date;
  },
  userId: string
): Promise<{ computedAmount: number; projectedCompletionDate: string | null }> {
  const targetAmount =
    typeof goal.targetAmount === "number" ? goal.targetAmount : goal.targetAmount.toNumber();

  let computedAmount = 0;

  switch (goal.trackingType) {
    case "NET_WORTH": {
      const snapshot = await prisma.netWorthSnapshot.findFirst({
        where: { userId },
        orderBy: { snapshotDate: "desc" },
      });
      computedAmount = snapshot ? Number(snapshot.netWorth) : 0;
      break;
    }

    case "SAVINGS": {
      const createdAt = (goal as any).createdAt ?? new Date(0);
      const income = await prisma.transaction.aggregate({
        where: { userId, type: "INCOME", date: { gte: createdAt } },
        _sum: { baseAmount: true },
      });
      const expense = await prisma.transaction.aggregate({
        where: { userId, type: "EXPENSE", date: { gte: createdAt } },
        _sum: { baseAmount: true },
      });
      const totalIncome = Number(income._sum.baseAmount ?? 0);
      const totalExpense = Number(expense._sum.baseAmount ?? 0);
      computedAmount = totalIncome - totalExpense;
      break;
    }

    case "ASSET": {
      if (goal.assetId) {
        const asset = await prisma.asset.findUnique({ where: { id: goal.assetId } });
        computedAmount = asset ? Number(asset.currentValue) : 0;
      }
      break;
    }

    case "MANUAL":
    default: {
      computedAmount =
        typeof goal.currentAmount === "number"
          ? goal.currentAmount
          : goal.currentAmount.toNumber();
      break;
    }
  }

  // Compute projected completion date
  let projectedCompletionDate: string | null = null;

  if (computedAmount < targetAmount) {
    // Compute monthly progress rate over last 3 months based on tracking type
    try {
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());

      let monthlyRate = 0;

      if (goal.trackingType === "NET_WORTH") {
        const snapshots = await prisma.netWorthSnapshot.findMany({
          where: { userId, snapshotDate: { gte: threeMonthsAgo } },
          orderBy: { snapshotDate: "asc" },
        });
        if (snapshots.length >= 2) {
          const oldest = Number(snapshots[0].netWorth);
          const latest = Number(snapshots[snapshots.length - 1].netWorth);
          const monthsSpan =
            (snapshots[snapshots.length - 1].snapshotDate.getTime() -
              snapshots[0].snapshotDate.getTime()) /
            (1000 * 60 * 60 * 24 * 30);
          monthlyRate = monthsSpan > 0 ? (latest - oldest) / monthsSpan : 0;
        }
      } else if (goal.trackingType === "SAVINGS") {
        const income = await prisma.transaction.aggregate({
          where: { userId, type: "INCOME", date: { gte: threeMonthsAgo } },
          _sum: { baseAmount: true },
        });
        const expense = await prisma.transaction.aggregate({
          where: { userId, type: "EXPENSE", date: { gte: threeMonthsAgo } },
          _sum: { baseAmount: true },
        });
        const netSavings =
          Number(income._sum.baseAmount ?? 0) - Number(expense._sum.baseAmount ?? 0);
        monthlyRate = netSavings / 3;
      }

      if (monthlyRate > 0) {
        const monthsToComplete = (targetAmount - computedAmount) / monthlyRate;
        const completionDate = new Date(
          now.getFullYear(),
          now.getMonth() + Math.ceil(monthsToComplete),
          1
        );
        projectedCompletionDate = completionDate.toISOString().split("T")[0];
      }
    } catch {
      // projection not available
    }
  }

  return { computedAmount, projectedCompletionDate };
}

export async function getGoalsWithProgress(userId: string): Promise<GoalWithProgress[]> {
  const goals = await prisma.financialGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const results: GoalWithProgress[] = [];

  for (const goal of goals) {
    const targetAmount = Number(goal.targetAmount);
    const { computedAmount, projectedCompletionDate } = await computeGoalProgress(goal, userId);

    const progressPct = targetAmount > 0 ? Math.min((computedAmount / targetAmount) * 100, 100) : 0;

    results.push({
      id: goal.id,
      userId: goal.userId,
      name: goal.name,
      targetAmount,
      currency: goal.currency,
      deadline: goal.deadline ? goal.deadline.toISOString().split("T")[0] : null,
      currentAmount: Number(goal.currentAmount),
      computedAmount,
      trackingType: goal.trackingType,
      assetId: goal.assetId,
      notes: goal.notes,
      isCompleted: goal.isCompleted,
      completedAt: goal.completedAt ? goal.completedAt.toISOString() : null,
      progressPct,
      projectedCompletionDate,
    });
  }

  return results;
}
