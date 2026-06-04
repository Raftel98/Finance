"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { goalSchema, type GoalInput } from "@/lib/validations/goal";
import type { GoalRow } from "@/hooks/useGoals";

interface AssetOption {
  id: string;
  name: string;
}

interface GoalModalProps {
  onClose: () => void;
  onSubmit: (data: GoalInput) => void;
  isLoading?: boolean;
  initialData?: GoalRow | null;
  assets?: AssetOption[];
}

const CURRENCIES = ["COP", "USD", "EUR", "MXN", "BRL", "CLP", "PEN", "ARS"];

const TRACKING_TYPES = [
  { value: "NET_WORTH", label: "Net Worth" },
  { value: "SAVINGS", label: "Savings" },
  { value: "ASSET", label: "Asset Value" },
  { value: "MANUAL", label: "Manual" },
];

export function GoalModal({ onClose, onSubmit, isLoading, initialData, assets = [] }: GoalModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          targetAmount: initialData.targetAmount,
          currency: initialData.currency,
          deadline: initialData.deadline ?? undefined,
          trackingType: initialData.trackingType as GoalInput["trackingType"],
          assetId: initialData.assetId ?? undefined,
          currentAmount: initialData.currentAmount,
          notes: initialData.notes ?? "",
        }
      : {
          trackingType: "MANUAL",
          currency: "COP",
          currentAmount: 0,
        },
  });

  const trackingType = watch("trackingType");

  const inputCls =
    "w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-medium">{initialData ? "Edit Goal" : "Add Goal"}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Goal Name</label>
            <input type="text" {...register("name")} className={inputCls} placeholder="e.g. Emergency Fund" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Target Amount + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Target Amount</label>
              <input
                type="number"
                step="any"
                {...register("targetAmount")}
                className={inputCls}
                placeholder="0"
              />
              {errors.targetAmount && (
                <p className="text-xs text-destructive">{errors.targetAmount.message}</p>
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

          {/* Tracking Type */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Tracking Type</label>
            <select {...register("trackingType")} className={inputCls}>
              {TRACKING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {trackingType === "NET_WORTH" && "Progress from latest net worth snapshot"}
              {trackingType === "SAVINGS" && "Progress from net income since goal creation"}
              {trackingType === "ASSET" && "Progress from linked asset current value"}
              {trackingType === "MANUAL" && "You update the current amount manually"}
            </p>
          </div>

          {/* Asset selector (ASSET type only) */}
          {trackingType === "ASSET" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Linked Asset</label>
              <select {...register("assetId")} className={inputCls}>
                <option value="">Select asset...</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {errors.assetId && (
                <p className="text-xs text-destructive">{errors.assetId.message}</p>
              )}
            </div>
          )}

          {/* Current Amount (MANUAL type only) */}
          {trackingType === "MANUAL" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Current Amount</label>
              <input
                type="number"
                step="any"
                {...register("currentAmount")}
                className={inputCls}
                placeholder="0"
              />
              {errors.currentAmount && (
                <p className="text-xs text-destructive">{errors.currentAmount.message}</p>
              )}
            </div>
          )}

          {/* Deadline */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Deadline (optional)</label>
            <input type="date" {...register("deadline")} className={inputCls} />
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
              {isLoading ? "Saving..." : initialData ? "Save Changes" : "Add Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
