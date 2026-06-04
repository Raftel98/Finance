"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { budgetSchema, type BudgetInput } from "@/lib/validations/budget";
import { useCategories } from "@/hooks/useCategories";
import type { BudgetRow } from "@/hooks/useBudgets";

interface BudgetModalProps {
  onClose: () => void;
  onSubmit: (data: BudgetInput) => void;
  isLoading?: boolean;
  initialData?: BudgetRow["budget"] | null;
  defaultYear: number;
  defaultMonth: number;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CURRENCIES = ["COP", "USD", "EUR", "MXN", "BRL", "CLP", "PEN", "ARS"];

export function BudgetModal({
  onClose,
  onSubmit,
  isLoading,
  initialData,
  defaultYear,
  defaultMonth,
}: BudgetModalProps) {
  const { data: categories } = useCategories();
  const expenseCategories = (categories ?? []).filter((c) => c.type === "EXPENSE");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: initialData
      ? {
          categoryId: initialData.categoryId,
          period: initialData.period as "MONTHLY" | "ANNUAL",
          year: initialData.year,
          month: initialData.month ?? undefined,
          projectedAmount: initialData.projectedAmount,
          currency: initialData.currency,
          notes: initialData.notes ?? "",
        }
      : {
          period: "MONTHLY",
          year: defaultYear,
          month: defaultMonth,
          currency: "COP",
        },
  });

  const period = watch("period");

  useEffect(() => {
    if (period === "ANNUAL") {
      setValue("month", undefined);
    }
  }, [period, setValue]);

  const inputCls =
    "w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-medium">{initialData ? "Edit Budget" : "Add Budget"}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Category */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select {...register("categoryId")} className={inputCls}>
              <option value="">Select category...</option>
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-xs text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          {/* Period */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Period</label>
            <select {...register("period")} className={inputCls}>
              <option value="MONTHLY">Monthly</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </div>

          {/* Year + Month */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Year</label>
              <input
                type="number"
                {...register("year")}
                className={inputCls}
                placeholder="2025"
              />
              {errors.year && (
                <p className="text-xs text-destructive">{errors.year.message}</p>
              )}
            </div>

            {period === "MONTHLY" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Month</label>
                <select {...register("month")} className={inputCls}>
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                {errors.month && (
                  <p className="text-xs text-destructive">{errors.month.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Budget Amount</label>
              <input
                type="number"
                step="any"
                {...register("projectedAmount")}
                className={inputCls}
                placeholder="0"
              />
              {errors.projectedAmount && (
                <p className="text-xs text-destructive">{errors.projectedAmount.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Currency</label>
              <select {...register("currency")} className={inputCls}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <input type="text" {...register("notes")} className={inputCls} placeholder="Add notes..." />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-1.5 text-sm border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-foreground text-background rounded-md px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Saving..." : initialData ? "Save Changes" : "Add Budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
