"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Download, Loader2 } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { useReportData, useRecentReports } from "@/hooks/useReports";
import { formatCurrency, cn } from "@/lib/utils";

const PERIOD_TYPES = ["MONTHLY", "QUARTERLY", "ANNUAL"] as const;
type PeriodType = (typeof PERIOD_TYPES)[number];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface Props {
  baseCurrency: string;
}

export function ReportsClient({ baseCurrency }: Props) {
  const now = new Date();
  const [periodType, setPeriodType] = useState<PeriodType>("MONTHLY");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const effectiveMonth = periodType === "ANNUAL" ? undefined : month;
  const { data, isLoading, error } = useReportData(periodType, year, effectiveMonth);
  const { data: recentData } = useRecentReports();

  const report = data?.report;
  const recentReports = recentData?.reports ?? [];

  const exportUrl = () => {
    const params = new URLSearchParams({ type: periodType, year: String(year) });
    if (effectiveMonth !== undefined) params.set("month", String(effectiveMonth));
    return `/api/reports/export?${params}`;
  };

  const savingsColor = (report?.savings ?? 0) >= 0 ? "up" : "down";

  // Build category progress bars
  const topCats = report?.topCategories ?? [];
  const maxCatAmount = topCats[0]?.amount ?? 1;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Type tabs */}
        <div className="flex rounded-lg border overflow-hidden">
          {PERIOD_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setPeriodType(t)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors capitalize",
                periodType === t ? "bg-foreground text-background" : "hover:bg-muted text-muted-foreground"
              )}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Year selector */}
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {[now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Month selector (hidden for ANNUAL) */}
        {periodType !== "ANNUAL" && (
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        )}

        <a
          href={exportUrl()}
          download
          className="ml-auto flex items-center gap-2 bg-foreground text-background rounded-md px-3 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-40 gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading report...
        </div>
      )}

      {error && (
        <div className="rounded-xl border bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load report data.
        </div>
      )}

      {!isLoading && !error && report && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricCard
              label="Total Income"
              value={formatCurrency(report.totalIncome, baseCurrency, true)}
              trend="up"
            />
            <MetricCard
              label="Total Expenses"
              value={formatCurrency(report.totalExpenses, baseCurrency, true)}
              trend="down"
            />
            <MetricCard
              label="Net Savings"
              value={formatCurrency(report.savings, baseCurrency, true)}
              trend={savingsColor}
            />
            <MetricCard
              label="Savings Rate"
              value={`${report.savingsRate.toFixed(1)}%`}
              sub={`${report.transactionCount} transactions`}
              trend={report.savingsRate >= 20 ? "up" : report.savingsRate >= 0 ? "neutral" : "down"}
            />
          </div>

          {/* Income vs Expenses Bar Chart — using 6 period comparison */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold mb-4">Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[{
                  period: periodType === "MONTHLY" ? MONTHS[month - 1] : String(year),
                  income: Math.round(report.totalIncome),
                  expenses: Math.round(report.totalExpenses),
                }]}
                margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrency(v, baseCurrency, true)}
                  width={80}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    formatCurrency(v, baseCurrency),
                    name === "income" ? "Income" : "Expenses",
                  ]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          {topCats.length > 0 && (
            <div className="rounded-xl border bg-card p-4">
              <h3 className="text-sm font-semibold mb-4">Expense Breakdown</h3>
              <div className="space-y-3">
                {topCats.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {cat.pct.toFixed(1)}%
                        </span>
                        <span className="text-sm font-medium tabular-nums">
                          {formatCurrency(cat.amount, baseCurrency, true)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-foreground/60 transition-all"
                        style={{ width: `${(cat.amount / maxCatAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Net worth change */}
          {(report.netWorthStart !== null || report.netWorthEnd !== null) && (
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="Net Worth (Start)"
                value={report.netWorthStart !== null ? formatCurrency(report.netWorthStart, baseCurrency, true) : "—"}
              />
              <MetricCard
                label="Net Worth (End)"
                value={report.netWorthEnd !== null ? formatCurrency(report.netWorthEnd, baseCurrency, true) : "—"}
                trend={
                  report.netWorthEnd !== null && report.netWorthStart !== null
                    ? report.netWorthEnd >= report.netWorthStart ? "up" : "down"
                    : undefined
                }
              />
            </div>
          )}
        </>
      )}

      {/* Past reports */}
      {recentReports.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold mb-3">Past Reports</h3>
          <div className="space-y-2">
            {(recentReports as any[]).map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                <div>
                  <span className="font-medium">{r.type}</span>
                  <span className="text-muted-foreground ml-2">
                    {new Date(r.periodStart).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    {" — "}
                    {new Date(r.periodEnd).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full", r.status === "READY" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground")}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
