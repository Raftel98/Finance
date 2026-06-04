"use client";

import { useState } from "react";
import { PlusCircle, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MetricCard } from "@/components/ui/MetricCard";
import { AssetModal } from "./AssetModal";
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from "@/hooks/useAssets";
import type { AssetRow } from "@/hooks/useAssets";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import type { AssetInput } from "@/lib/validations/asset";

const ASSET_TYPE_LABELS: Record<string, string> = {
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

const PIE_COLORS = [
  "hsl(var(--chart-1, 221 83% 53%))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
  "#6366f1",
  "#14b8a6",
  "#f59e0b",
  "#ec4899",
];

interface AssetsClientProps {
  initialData: {
    assets: AssetRow[];
    totals: { totalAssets: number; totalLiquid: number; currency: string };
  };
  baseCurrency: string;
}

export function AssetsClient({ initialData, baseCurrency }: AssetsClientProps) {
  const { data = initialData, isLoading } = useAssets();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const [modal, setModal] = useState<{ open: boolean; asset?: AssetRow | null }>({
    open: false,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { assets, totals } = data;

  const totalInvestments = assets
    .filter((a) => ["STOCKS", "ETF", "CRYPTO"].includes(a.type))
    .reduce((s, a) => s + a.baseValue, 0);

  const totalUnrealized = assets.reduce(
    (s, a) => s + (a.unrealizedGain ?? 0),
    0
  );

  // Build pie data
  const typeMap: Record<string, number> = {};
  for (const a of assets) {
    typeMap[a.type] = (typeMap[a.type] ?? 0) + a.baseValue;
  }
  const pieData = Object.entries(typeMap).map(([name, value]) => ({
    name: ASSET_TYPE_LABELS[name] ?? name,
    value,
  }));

  async function handleSubmit(formData: AssetInput) {
    if (modal.asset) {
      await updateAsset.mutateAsync({ id: modal.asset.id, ...formData });
    } else {
      await createAsset.mutateAsync(formData);
    }
    setModal({ open: false });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this asset?")) return;
    setDeletingId(id);
    try {
      await deleteAsset.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total assets"
          value={formatCurrency(totals.totalAssets, baseCurrency, true)}
          sub={`${assets.length} asset${assets.length !== 1 ? "s" : ""}`}
        />
        <MetricCard
          label="Liquid assets"
          value={formatCurrency(totals.totalLiquid, baseCurrency, true)}
          sub={
            totals.totalAssets > 0
              ? `${((totals.totalLiquid / totals.totalAssets) * 100).toFixed(0)}% of total`
              : "0% of total"
          }
        />
        <MetricCard
          label="Investments"
          value={formatCurrency(totalInvestments, baseCurrency, true)}
          sub={
            totals.totalAssets > 0
              ? `${((totalInvestments / totals.totalAssets) * 100).toFixed(0)}% of total`
              : "0% of total"
          }
        />
        <MetricCard
          label="Unrealized gain"
          value={formatCurrency(totalUnrealized, baseCurrency, true)}
          trend={totalUnrealized > 0 ? "up" : totalUnrealized < 0 ? "down" : "neutral"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pie chart */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-medium mb-3">Asset allocation</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCurrency(v, baseCurrency, true)}
                  contentStyle={{ fontSize: 12 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">
              No assets yet
            </div>
          )}
        </div>

        {/* Table */}
        <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-medium">Assets</h3>
            <button
              onClick={() => setModal({ open: true, asset: null })}
              className="bg-foreground text-background rounded-md px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 flex items-center gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add asset
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">Value</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                    {baseCurrency} value
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                    Gain %
                  </th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                )}
                {!isLoading && assets.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                      No assets yet. Add your first asset.
                    </td>
                  </tr>
                )}
                {assets.map((asset) => (
                  <tr key={asset.id} className="border-b last:border-0 hover:bg-muted/20 group">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{asset.name}</div>
                      {asset.institution && (
                        <div className="text-xs text-muted-foreground">{asset.institution}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                        {ASSET_TYPE_LABELS[asset.type] ?? asset.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm">
                      {formatCurrency(asset.currentValue, asset.currency)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm">
                      {formatCurrency(asset.baseValue, baseCurrency)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm">
                      {asset.unrealizedGainPct != null ? (
                        <span
                          className={
                            asset.unrealizedGainPct >= 0
                              ? "text-success flex items-center justify-end gap-0.5"
                              : "text-destructive flex items-center justify-end gap-0.5"
                          }
                        >
                          {asset.unrealizedGainPct >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {formatPercent(asset.unrealizedGainPct)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button
                          onClick={() => setModal({ open: true, asset })}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          disabled={deletingId === asset.id}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal.open && (
        <AssetModal
          asset={modal.asset}
          onClose={() => setModal({ open: false })}
          onSubmit={handleSubmit}
          isLoading={createAsset.isPending || updateAsset.isPending}
        />
      )}
    </div>
  );
}
