"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCategories } from "@/hooks/useCategories";
import { useCreateTransaction, useUpdateTransaction, useTransactions } from "@/hooks/useTransactions";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER", "ADJUSTMENT"]),
  amount: z.coerce.number().positive("Must be positive"),
  currency: z.string().min(3).max(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categoryId: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  merchant: z.string().max(200).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isRecurring: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  editingId: string | null;
  baseCurrency: string;
  onClose: () => void;
}

export function TransactionModal({ editingId, baseCurrency, onClose }: Props) {
  const isEditing = !!editingId;
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  // Fetch existing transaction if editing
  const { data: listData } = useTransactions({});
  const existing = editingId
    ? listData?.transactions.find((t) => t.id === editingId)
    : null;

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "EXPENSE",
      currency: baseCurrency,
      date: today,
      isRecurring: false,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      reset({
        type: existing.type as any,
        amount: Math.abs(existing.amount),
        currency: existing.currency,
        date: existing.date,
        categoryId: existing.categoryId ?? null,
        description: existing.description ?? null,
        merchant: existing.merchant ?? null,
        notes: existing.notes ?? null,
        isRecurring: existing.isRecurring,
      });
    }
  }, [existing, reset]);

  const selectedType = watch("type");
  const filteredCategories = categories.filter(
    (c) => c.type === (selectedType === "INCOME" ? "INCOME" : "EXPENSE")
  );

  async function onSubmit(data: FormValues) {
    try {
      if (isEditing && editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...data });
      } else {
        await createMutation.mutateAsync(data);
      }
      onClose();
    } catch (e) {
      console.error(e);
    }
  }

  const mutationError = createMutation.error || updateMutation.error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-medium">
            {isEditing ? "Edit transaction" : "Add transaction"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Type</label>
            <div className="flex rounded-md border overflow-hidden">
              {(["INCOME", "EXPENSE", "TRANSFER"] as const).map((t) => (
                <label
                  key={t}
                  className={cn(
                    "flex-1 text-center py-1.5 text-xs font-medium cursor-pointer transition-colors",
                    watch("type") === t
                      ? t === "INCOME"
                        ? "bg-success/20 text-success"
                        : t === "EXPENSE"
                        ? "bg-destructive/20 text-destructive"
                        : "bg-muted text-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <input type="radio" value={t} {...register("type")} className="sr-only" />
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Amount + Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-destructive text-xs mt-1">{errors.amount.message}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Currency</label>
              <select
                className="w-full h-9 px-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("currency")}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
            <input
              type="date"
              className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("date")}
            />
          </div>

          {/* Merchant + Description */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Merchant</label>
              <input
                type="text"
                placeholder="e.g. Rappi"
                className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("merchant")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <input
                type="text"
                placeholder="Optional note"
                className="w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                {...register("description")}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
            <select
              className="w-full h-9 px-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("categoryId")}
            >
              <option value="">No category</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
            <textarea
              rows={2}
              placeholder="Optional notes…"
              className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              {...register("notes")}
            />
          </div>

          {/* Recurring */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border"
              {...register("isRecurring")}
            />
            <span className="text-xs text-muted-foreground">Mark as recurring</span>
          </label>

          {mutationError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
              Something went wrong. Please try again.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 rounded-md border text-xs hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-8 px-4 rounded-md bg-foreground text-background text-xs font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? isEditing ? "Saving…" : "Adding…"
                : isEditing ? "Save changes" : "Add transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
