"use client";

import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MetricCard } from "@/components/ui/MetricCard";
import { ScenarioPanel } from "./ScenarioPanel";
import { useForecast } from "@/hooks/useForecast";
import { cn, formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

const PERIOD_OPTIONS = [
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "12M", months: 12 },
  { label: "24M", months: 24 },
];

interface Props {
  baseCurrency: string;
}

function shortMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export function ForecastClient({ baseCurrency }: Props) {
  const [months, setMonths] = useState(12);
  const [scenarioId, setScenarioId] = useState<string | undefined>();
  const [showScenarios, setShowScenarios] = useState(false);

  const { data, isLoading, error } = useForecast(months, scenarioId);
  const projections = data?.projections ?? [];

  const lastProjection = projections[projections.length - 1];
  const firstProjection = projections[0];

  const projectedNW = lastProjection?.projectedNetWorth ?? 0;
  const projectedDebt = lastProjection?.projectedDebt ?? 0;
  const totalSavings = lastProjection?.cumulativeSavings ?? 0;
  const totalIncome = projections.reduce((s, p) => s + p.projectedIncome, 0);
  const totalExpenses = projections.reduce((s, p) => s + p.projectedExpenses, 0);
  const avgCashFlow = projections.length > 0 ? totalSavings / projections.length : 0;
  const cashRunwayMonths = avgCashFlow > 0 ? Math.floor(totalExpenses / avgCashFlow) : 0;

  const chartData = projections.map((p) => ({
    month: shortMonth(p.month),
    netWorth: Math.round(p.projectedNetWorth),
    income: Math.round(p.projectedIncome),
    expenses: Math.round(p.projectedExpenses),
    cashFlow: Math.round(p.cashFlow),
  }));

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border overflow-hidden">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.months}
              onClick={() => setMonths(opt.months)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                months === opt.months
                  ? "bg-foreground text-background"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowScenarios(!showScenarios)}
          className={cn(
            "ml-auto flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors",
            scenarioId ? "bg-foreground text-background" : "hover:bg-muted"
          )}
        >
          Scenarios {showScenarios ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {showScenarios && (
        <ScenarioPanel
          activeScenarioId={scenarioId}
          onSelectScenario={setScenarioId}
          baseCurrency={baseCurrency}
        />
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label={`Projected NW (${months}M)`}
          value={formatCurrency(projectedNW, baseCurrency, true)}
          trend={projectedNW > 0 ? "up" : "down"}
        />
        <MetricCard
          label="Projected Savings"
          value={formatCurrency(totalSavings, baseCurrency, true)}
          trend={totalSavings >= 0 ? "up" : "down"}
          sub={`over ${months} months`}
        />
        <MetricCard
          label="Projected Debt"
          value={formatCurrency(projectedDebt, baseCurrency, true)}
          trend={projectedDebt > 0 ? "down" : "neutral"}
        />
        <MetricCard
          label="Cash Runway"
          value={`${cashRunwayMonths} months`}
          trend={cashRunwayMonths > 6 ? "up" : cashRunwayMonths > 3 ? "neutral" : "down"}
          sub="at current expenses"
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          Calculating forecast...
        </div>
      )}

      {error && (
        <div className="rounded-xl border bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load forecast data.
        </div>
      )}

      {!isLoading && !error && projections.length > 0 && (
        <>
          {/* Net Worth Projection Chart */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold mb-4">Net Worth Projection</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="nwGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrency(v, baseCurrency, true)}
                  width={80}
                />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v, baseCurrency), "Net Worth"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  fill="url(#nwGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Cash Flow Chart */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold mb-4">Monthly Cash Flow</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatCurrency(v, baseCurrency, true)}
                  width={80}
                />
                <Tooltip
                  formatter={(v: number, name: string) => [formatCurrency(v, baseCurrency), name === "income" ? "Income" : "Expenses"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {!isLoading && !error && projections.length === 0 && (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          <p className="text-sm">No recurring rules found. Add income and expense rules to generate a forecast.</p>
        </div>
      )}
    </div>
  );
}
