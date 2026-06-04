"use client";

import { useState } from "react";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { MetricCard } from "@/components/ui/MetricCard";
import { LiabilityModal } from "./LiabilityModal";
import {
  useLiabilities,
  useCreateLiability,
  useUpdateLiability,
  useDeleteLiability,
} from "@/hooks/useLiabilities";
import { useCreditCards } from "@/hooks/useCreditCards";
import type { LiabilityRow, LiabilitiesResponse } from "@/hooks/useLiabilities";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import type { LiabilityInput } from "@/lib/validations/liability";

const LIABILITY_TYPE_LABELS: Record<string, string> = {
  CREDIT_CARD: "Credit card",
  PERSONAL_LOAN: "Personal loan",
  MORTGAGE: "Mortgage",
  VEHICLE_LOAN: "Vehicle loan",
  STUDENT_LOAN: "Student loan",
  OTHER: "Other",
};

interface LiabilitiesClientProps {
  initialData: LiabilitiesResponse;
  baseCurrency: string;
}

export function LiabilitiesClient({ initialData, baseCurrency }: LiabilitiesClientProps) {
  const { data = initialData, isLoading } = useLiabilities();
  const { data: cardsData } = useCreditCards();
  const createLiability = useCreateLiability();
  const updateLiability = useUpdateLiability();
  const deleteLiability = useDeleteLiability();

  const [modal, setModal] = useState<{ open: boolean; liability?: LiabilityRow | null }>({
    open: false,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { liabilities, totals } = data;

  // DTI ratio — simplified: monthly debt payments / assumed monthly income
  // We display based on min payments
  const dtiRatio =
    totals.totalDebt > 0 && totals.totalMinPayments > 0
      ? (totals.totalMinPayments / (totals.totalDebt * 0.005)) * 100
      : 0;

  // Bar chart data by type
  const typeMap: Record<string, number> = {};
  for (const l of liabilities) {
    typeMap[l.type] = (typeMap[l.type] ?? 0) + l.baseBalance;
  }
  const barData = Object.entries(typeMap).map(([type, amount]) => ({
    type: LIABILITY_TYPE_LABELS[type] ?? type,
    amount,
  }));

  async function handleSubmit(formData: LiabilityInput) {
    if (modal.liability) {
      await updateLiability.mutateAsync({ id: modal.liability.id, ...formData });
    } else {
      await createLiability.mutateAsync(formData);
    }
    setModal({ open: false });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this liability?")) return;
    setDeletingId(id);
    try {
      await deleteLiability.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total debt"
          value={formatCurrency(totals.totalDebt, baseCurrency, true)}
          sub={`${liabilities.length} liabilit${liabilities.length !== 1 ? "ies" : "y"}`}
          trend="down"
        />
        <MetricCard
          label="Min. payments"
          value={formatCurrency(totals.totalMinPayments, baseCurrency, true)}
          sub="per month"
        />
        <MetricCard
          label="Credit utilization"
          value={`${totals.creditUtilization.toFixed(1)}%`}
          trend={
            totals.creditUtilization > 30
              ? "down"
              : totals.creditUtilization > 0
              ? "neutral"
              : "neutral"
          }
          sub={totals.creditUtilization > 30 ? "High — aim for < 30%" : "Healthy"}
        />
        <MetricCard
          label="DTI ratio"
          value={`${dtiRatio.toFixed(1)}%`}
          sub={dtiRatio > 43 ? "High" : "Manageable"}
          trend={dtiRatio > 43 ? "down" : "neutral"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Bar chart */}
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-medium mb-3">Debt by category</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="type"
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
                  formatter={(v: number) => formatCurrency(v, baseCurrency, true)}
                  contentStyle={{ fontSize: 12 }}
                />
                <Bar
                  dataKey="amount"
                  fill="hsl(var(--destructive))"
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-xs text-muted-foreground">
              No liabilities yet
            </div>
          )}
        </div>

        {/* Table */}
        <div className="lg:col-span-2 rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-medium">Liabilities</h3>
            <button
              onClick={() => setModal({ open: true, liability: null })}
              className="bg-foreground text-background rounded-md px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 flex items-center gap-1.5"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add liability
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                    Balance
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                    Rate
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                    Min. payment
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-muted-foreground">
                    Due date
                  </th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      Loading...
                    </td>
                  </tr>
                )}
                {!isLoading && liabilities.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      No liabilities yet.
                    </td>
                  </tr>
                )}
                {liabilities.map((liability) => (
                  <tr
                    key={liability.id}
                    className="border-b last:border-0 hover:bg-muted/20 group"
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{liability.name}</div>
                      {liability.creditCard && (
                        <div className="text-xs text-muted-foreground">
                          {liability.creditCard.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive">
                        {LIABILITY_TYPE_LABELS[liability.type] ?? liability.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm">
                      {formatCurrency(liability.balance, liability.currency)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm">
                      {liability.interestRate != null
                        ? `${liability.interestRate.toFixed(2)}%`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm">
                      {liability.minimumPayment != null
                        ? formatCurrency(liability.minimumPayment, liability.currency)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {liability.dueDate ? formatDate(liability.dueDate, "short") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button
                          onClick={() => setModal({ open: true, liability })}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(liability.id)}
                          disabled={deletingId === liability.id}
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
        <LiabilityModal
          liability={modal.liability}
          creditCards={cardsData?.cards}
          onClose={() => setModal({ open: false })}
          onSubmit={handleSubmit}
          isLoading={createLiability.isPending || updateLiability.isPending}
        />
      )}
    </div>
  );
}
