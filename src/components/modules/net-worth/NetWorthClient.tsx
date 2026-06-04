"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { useNetWorthHistory, useCreateSnapshot } from "@/hooks/useNetWorth";
import type { NetWorthResponse } from "@/hooks/useNetWorth";
import { formatCurrency, formatDate, formatMonthYear, cn } from "@/lib/utils";

const PIE_COLORS = [
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#ec4899",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
];

interface NetWorthClientProps {
  initialData: NetWorthResponse;
}

export function NetWorthClient({ initialData }: NetWorthClientProps) {
  const { data = initialData, isLoading } = useNetWorthHistory();
  const createSnapshot = useCreateSnapshot();
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  const { current, history, baseCurrency } = data;

  async function handleCreateSnapshot() {
    setCreatingSnapshot(true);
    try {
      await createSnapshot.mutateAsync();
    } finally {
      setCreatingSnapshot(false);
    }
  }

  // Area chart data
  const chartData = history.map((s, i) => {
    const prev = i > 0 ? history[i - 1] : null;
    const momChange = prev ? s.netWorth - prev.netWorth : null;
    return {
      date: formatMonthYear(s.snapshotDate),
      assets: s.totalAssets,
      liabilities: s.totalLiabilities,
      netWorth: s.netWorth,
      momChange,
    };
  });

  // Currency breakdown from latest snapshot
  const currencyBreakdown = current?.currencyBreakdown
    ? Object.entries(current.currencyBreakdown as Record<string, { assets: number; liabilities: number }>)
    : [];

  // Asset allocation pie data
  const assetBreakdown = current?.assetBreakdown
    ? Object.entries(current.assetBreakdown as Record<string, number>).map(
        ([type, value]) => ({ name: type, value })
      )
    : [];

  const ASSET_LABELS: Record<string, string> = {
    CASH: "Cash",
    CHECKING: "Checking",
    SAVINGS: "Savings",
    STOCKS: "Stocks",
    ETF: "ETF",
    CRYPTO: "Crypto",
    REAL_ESTATE: "Real estate",
    VEHICLE: "Vehicle",
    OTHER: "Other",
  };

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Net worth"
          value={formatCurrency(current?.netWorth ?? 0, baseCurrency, true)}
          trend={
            current?.momChange != null
              ? current.momChange >= 0
                ? "up"
                : "down"
              : "neutral"
          }
          sub={
            current?.momChangePct != null
              ? `${current.momChangePct >= 0 ? "+" : ""}${current.momChangePct.toFixed(1)}% MoM`
              : "No previous data"
          }
        />
        <MetricCard
          label="MoM change"
          value={formatCurrency(current?.momChange ?? 0, baseCurrency, true)}
          trend={
            current?.momChange != null
              ? current.momChange >= 0
                ? "up"
                : "down"
              : "neutral"
          }
        />
        <MetricCard
          label="Total assets"
          value={formatCurrency(current?.totalAssets ?? 0, baseCurrency, true)}
          trend="up"
        />
        <MetricCard
          label="Total liabilities"
          value={formatCurrency(current?.totalLiabilities ?? 0, baseCurrency, true)}
          trend="down"
        />
      </div>

      {/* Area chart */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Net worth history</h3>
          <button
            onClick={handleCreateSnapshot}
            disabled={creatingSnapshot}
            className="bg-foreground text-background rounded-md px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 flex items-center gap-1.5"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", creatingSnapshot && "animate-spin")} />
            {creatingSnapshot ? "Creating..." : "Create snapshot"}
          </button>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="assetsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => formatCurrency(v, baseCurrency, true)}
              />
              <Tooltip
                formatter={(v: number, name: string) => [
                  formatCurrency(v, baseCurrency, true),
                  name === "netWorth"
                    ? "Net worth"
                    : name === "assets"
                    ? "Assets"
                    : "Liabilities",
                ]}
                contentStyle={{ fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="assets"
                stroke="#10b981"
                fill="url(#assetsGradient)"
                strokeWidth={1.5}
              />
              <Area
                type="monotone"
                dataKey="netWorth"
                stroke="#6366f1"
                fill="url(#netWorthGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground">
            <p>No snapshots yet.</p>
            <button
              onClick={handleCreateSnapshot}
              disabled={creatingSnapshot}
              className="bg-foreground text-background rounded-md px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
            >
              Create first snapshot
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Currency breakdown */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-medium mb-3">By currency</h3>
          {currencyBreakdown.length > 0 ? (
            <div className="space-y-2">
              {currencyBreakdown.map(([currency, breakdown]) => (
                <div
                  key={currency}
                  className="flex items-center justify-between py-1.5 border-b last:border-0"
                >
                  <span className="text-sm font-medium">{currency}</span>
                  <div className="text-right">
                    <p className="text-sm tabular-nums text-success">
                      +{formatCurrency(breakdown.assets, currency, true)}
                    </p>
                    {breakdown.liabilities > 0 && (
                      <p className="text-xs tabular-nums text-destructive">
                        -{formatCurrency(breakdown.liabilities, currency, true)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No data available</p>
          )}
        </div>

        {/* Asset allocation donut */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-medium mb-3">Asset allocation</h3>
          {assetBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={assetBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {assetBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, name: string) => [
                    formatCurrency(v, baseCurrency, true),
                    ASSET_LABELS[name] ?? name,
                  ]}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend
                  formatter={(value) => ASSET_LABELS[value] ?? value}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">
              No asset data
            </div>
          )}
        </div>
      </div>

      {/* Snapshot history table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="text-sm font-medium">Snapshot history</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                  Date
                </th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                  Assets
                </th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                  Liabilities
                </th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                  Net worth
                </th>
                <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                  MoM change
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              )}
              {!isLoading && history.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                    No snapshots yet.
                  </td>
                </tr>
              )}
              {[...history].reverse().map((snapshot, i) => {
                const prevSnapshot = [...history].reverse()[i + 1];
                const momChange = prevSnapshot
                  ? snapshot.netWorth - prevSnapshot.netWorth
                  : null;
                const momPct =
                  momChange != null && prevSnapshot && prevSnapshot.netWorth !== 0
                    ? (momChange / Math.abs(prevSnapshot.netWorth)) * 100
                    : null;

                return (
                  <tr
                    key={snapshot.id}
                    className="border-b last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 text-sm">
                      {formatDate(snapshot.snapshotDate, "medium")}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm text-success">
                      {formatCurrency(snapshot.totalAssets, snapshot.currency, true)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm text-destructive">
                      {formatCurrency(snapshot.totalLiabilities, snapshot.currency, true)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm font-medium">
                      {formatCurrency(snapshot.netWorth, snapshot.currency, true)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {momChange != null ? (
                        <span
                          className={cn(
                            "text-xs tabular-nums flex items-center justify-end gap-0.5",
                            momChange >= 0 ? "text-success" : "text-destructive"
                          )}
                        >
                          {momChange >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {momPct != null
                            ? `${momPct >= 0 ? "+" : ""}${momPct.toFixed(1)}%`
                            : "—"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
