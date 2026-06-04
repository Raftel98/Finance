"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { BudgetModal } from "./BudgetModal";
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget, type BudgetRow } from "@/hooks/useBudgets";
import { formatCurrency, cn } from "@/lib/utils";
import type { BudgetInput } from "@/lib/validations/budget";

interface BudgetsClientProps {
  baseCurrency: string;
}

type TabType = "Monthly" | "Annual";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function BudgetsClient({ baseCurrency }: BudgetsClientProps) {
  const now = new Date();
  const [tab, setTab] = useState<TabType>("Monthly");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetRow["budget"] | null>(null);

  const isMonthly = tab === "Monthly";
  const { data: budgets = [], isLoading } = useBudgets(year, isMonthly ? month : undefined);

  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  // Summary metrics
  const totalBudgeted = budgets.reduce((s, b) => s + b.budget.projectedAmount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.actualSpending, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const overBudgetCount = budgets.filter((b) => b.variance < 0).length;

  function prevPeriod() {
    if (isMonthly) {
      if (month === 1) { setMonth(12); setYear((y) => y - 1); }
      else setMonth((m) => m - 1);
    } else {
      setYear((y) => y - 1);
    }
  }

  function nextPeriod() {
    if (isMonthly) {
      if (month === 12) { setMonth(1); setYear((y) => y + 1); }
      else setMonth((m) => m + 1);
    } else {
      setYear((y) => y + 1);
    }
  }

  const periodLabel = isMonthly ? `${MONTH_NAMES[month - 1]} ${year}` : `${year}`;

  async function handleSubmit(data: BudgetInput) {
    if (editingBudget) {
      await updateBudget.mutateAsync({ id: editingBudget.id, ...data });
    } else {
      await createBudget.mutateAsync(data as unknown as Record<string, unknown>);
    }
    setShowModal(false);
    setEditingBudget(null);
  }

  function openEdit(budget: BudgetRow["budget"]) {
    setEditingBudget(budget);
    setShowModal(true);
  }

  function openAdd() {
    setEditingBudget(null);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this budget?")) return;
    await deleteBudget.mutateAsync(id);
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        {(["Monthly", "Annual"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
              tab === t
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevPeriod} className="rounded-md p-1 hover:bg-muted border">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium tabular-nums min-w-[140px] text-center">
            {periodLabel}
          </span>
          <button onClick={nextPeriod} className="rounded-md p-1 hover:bg-muted border">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button onClick={openAdd} className="bg-foreground text-background rounded-md px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 transition-colors flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add budget
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Total Budgeted"
          value={formatCurrency(totalBudgeted, baseCurrency, true)}
          sub="Planned spend"
          trend="neutral"
        />
        <MetricCard
          label="Total Spent"
          value={formatCurrency(totalSpent, baseCurrency, true)}
          sub={totalBudgeted > 0 ? `${((totalSpent / totalBudgeted) * 100).toFixed(0)}% of budget` : "No budget set"}
          trend={totalSpent > totalBudgeted ? "down" : "neutral"}
        />
        <MetricCard
          label="Remaining"
          value={formatCurrency(Math.abs(totalRemaining), baseCurrency, true)}
          sub={totalRemaining >= 0 ? "Under budget" : "Over budget"}
          trend={totalRemaining >= 0 ? "up" : "down"}
        />
        <MetricCard
          label="Over Budget"
          value={String(overBudgetCount)}
          sub={overBudgetCount === 1 ? "category" : "categories"}
          trend={overBudgetCount > 0 ? "down" : "up"}
        />
      </div>

      {/* Budget list */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading budgets...</div>
        ) : budgets.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No budgets for this period.{" "}
            <button onClick={openAdd} className="underline hover:no-underline">
              Add one
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {budgets.map((item) => {
              const isOver = item.variance < 0;
              const pct = Math.min(item.progressPct, 100);
              const barColor = isOver
                ? "bg-destructive"
                : pct > 80
                ? "bg-amber-500"
                : "bg-emerald-500";

              return (
                <div key={item.budget.id} className="flex items-center gap-4 px-5 py-4 group hover:bg-muted/30 transition-colors">
                  {/* Category icon */}
                  <div className="flex-none w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm">
                    {item.budget.category.icon ?? "📁"}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{item.budget.category.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Variance badge */}
                        <span
                          className={cn(
                            "text-xs px-2 py-0.5 rounded-full tabular-nums font-medium",
                            isOver
                              ? "bg-destructive/10 text-destructive"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {isOver ? "−" : "+"}
                          {formatCurrency(Math.abs(item.variance), item.budget.currency, true)}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", barColor)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                      <span>
                        {formatCurrency(item.actualSpending, item.budget.currency, true)} spent
                      </span>
                      <span>
                        {formatCurrency(item.budget.projectedAmount, item.budget.currency, true)} budgeted
                      </span>
                    </div>
                  </div>

                  {/* Edit/Delete */}
                  <div className="flex-none flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(item.budget)}
                      className="p-1 rounded hover:bg-muted"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.budget.id)}
                      className="p-1 rounded hover:bg-muted"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <BudgetModal
          onClose={() => { setShowModal(false); setEditingBudget(null); }}
          onSubmit={handleSubmit}
          isLoading={createBudget.isPending || updateBudget.isPending}
          initialData={editingBudget}
          defaultYear={year}
          defaultMonth={month}
        />
      )}
    </div>
  );
}
