"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency, formatMonthYear } from "@/lib/utils";

interface Snapshot {
  date: string;
  netWorth: number;
  assets: number;
  liabilities: number;
}

interface Props {
  snapshots: Snapshot[];
  currency: string;
}

function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="text-xs">
          {p.name}: {formatCurrency(p.value, currency, true)}
        </p>
      ))}
    </div>
  );
}

export function DashboardCharts({ snapshots, currency }: Props) {
  const data = snapshots.map((s) => ({
    month: formatMonthYear(s.date),
    "Net worth": s.netWorth,
    Assets: s.assets,
    Liabilities: s.liabilities,
  }));

  // If no snapshots yet, show placeholder
  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-4 h-52 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No snapshots yet — data appears at end of month</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">Net worth evolution</p>
        <p className="text-xs text-muted-foreground">Monthly snapshots</p>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#1D9E75" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCurrency(v, currency, true).replace(currency + " ", "")}
            width={48}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Area
            type="monotone"
            dataKey="Net worth"
            stroke="#1D9E75"
            strokeWidth={2}
            fill="url(#netWorthGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
