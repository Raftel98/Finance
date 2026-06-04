import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageShell } from "@/components/ui/PageShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { DashboardCharts } from "@/components/modules/DashboardCharts";
import { RecentTransactions } from "@/components/modules/RecentTransactions";
import { GoalsSummary } from "@/components/modules/GoalsSummary";
import { KpiGrid } from "@/components/modules/KpiGrid";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const currency = (session!.user as any).baseCurrency ?? "COP";

  // Latest snapshot
  const latestSnapshot = await prisma.netWorthSnapshot.findFirst({
    where: { userId },
    orderBy: { snapshotDate: "desc" },
  });

  // Previous snapshot for comparison
  const previousSnapshot = await prisma.netWorthSnapshot.findFirst({
    where: { userId },
    orderBy: { snapshotDate: "desc" },
    skip: 1,
  });

  // Current month income
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "INCOME", date: { gte: monthStart, lte: monthEnd } },
      _sum: { baseAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "EXPENSE", date: { gte: monthStart, lte: monthEnd } },
      _sum: { baseAmount: true },
    }),
  ]);

  // Recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 5,
    include: { category: true },
  });

  // Goals
  const goals = await prisma.financialGoal.findMany({
    where: { userId, isCompleted: false },
    orderBy: { createdAt: "asc" },
    take: 3,
  });

  // Last 6 snapshots for chart
  const snapshots = await prisma.netWorthSnapshot.findMany({
    where: { userId },
    orderBy: { snapshotDate: "asc" },
    take: 12,
  });

  const netWorth = Number(latestSnapshot?.netWorth ?? 0);
  const prevNetWorth = Number(previousSnapshot?.netWorth ?? netWorth);
  const monthlyChange = netWorth - prevNetWorth;
  const monthlyChangePct = prevNetWorth ? (monthlyChange / Math.abs(prevNetWorth)) * 100 : 0;

  const monthlyIncome = Number(incomeAgg._sum.baseAmount ?? 0);
  const monthlyExpenses = Number(expenseAgg._sum.baseAmount ?? 0);
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

  const totalDebt = Number(latestSnapshot?.totalLiabilities ?? 0);

  return (
    <PageShell title="Dashboard">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard
          label="Net worth"
          value={formatCurrency(netWorth, currency, true)}
          sub={`${monthlyChangePct >= 0 ? "+" : ""}${monthlyChangePct.toFixed(1)}% vs last month`}
          trend={monthlyChangePct >= 0 ? "up" : "down"}
        />
        <MetricCard
          label="Monthly savings"
          value={formatCurrency(monthlySavings, currency, true)}
          sub={`${savingsRate.toFixed(0)}% savings rate`}
          trend={monthlySavings >= 0 ? "up" : "down"}
        />
        <MetricCard
          label="Total debt"
          value={formatCurrency(totalDebt, currency, true)}
          sub="Across all liabilities"
          trend="neutral"
        />
        <MetricCard
          label="Monthly income"
          value={formatCurrency(monthlyIncome, currency, true)}
          sub={`−${formatCurrency(monthlyExpenses, currency, true)} expenses`}
          trend="up"
        />
      </div>

      {/* Charts + KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <DashboardCharts
            snapshots={snapshots.map((s) => ({
              date: s.snapshotDate.toISOString(),
              netWorth: Number(s.netWorth),
              assets: Number(s.totalAssets),
              liabilities: Number(s.totalLiabilities),
            }))}
            currency={currency}
          />
        </div>
        <KpiGrid
          savingsRate={savingsRate}
          monthlyIncome={monthlyIncome}
          totalDebt={totalDebt}
        />
      </div>

      {/* Transactions + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RecentTransactions
            transactions={recentTransactions.map((t) => ({
              id: t.id,
              description: t.description ?? "",
              merchant: t.merchant ?? "",
              amount: Number(t.amount),
              currency: t.currency,
              baseAmount: Number(t.baseAmount ?? t.amount),
              type: t.type,
              date: t.date.toISOString(),
              category: t.category?.name ?? null,
              categoryIcon: t.category?.icon ?? null,
            }))}
            baseCurrency={currency}
          />
        </div>
        <GoalsSummary
          goals={goals.map((g) => ({
            id: g.id,
            name: g.name,
            targetAmount: Number(g.targetAmount),
            currentAmount: Number(g.currentAmount),
            currency: g.currency,
            deadline: g.deadline?.toISOString() ?? null,
          }))}
        />
      </div>
    </PageShell>
  );
}
