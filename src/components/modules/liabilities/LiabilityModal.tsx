"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { liabilitySchema, LiabilityInput, LIABILITY_TYPES } from "@/lib/validations/liability";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import type { LiabilityRow } from "@/hooks/useLiabilities";
import type { CreditCardRow } from "@/hooks/useCreditCards";

const LIABILITY_TYPE_LABELS: Record<string, string> = {
  CREDIT_CARD: "Credit card",
  PERSONAL_LOAN: "Personal loan",
  MORTGAGE: "Mortgage",
  VEHICLE_LOAN: "Vehicle loan",
  STUDENT_LOAN: "Student loan",
  OTHER: "Other",
};

interface LiabilityModalProps {
  liability?: LiabilityRow | null;
  creditCards?: CreditCardRow[];
  onClose: () => void;
  onSubmit: (data: LiabilityInput) => Promise<void>;
  isLoading?: boolean;
}

const INPUT_CLASS =
  "w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const LABEL_CLASS = "block text-xs font-medium text-muted-foreground mb-1";

export function LiabilityModal({
  liability,
  creditCards = [],
  onClose,
  onSubmit,
  isLoading,
}: LiabilityModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<LiabilityInput>({
    resolver: zodResolver(liabilitySchema),
    defaultValues: {
      name: "",
      type: "PERSONAL_LOAN",
      currency: "COP",
      balance: 0,
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (liability) {
      reset({
        name: liability.name,
        type: liability.type as LiabilityInput["type"],
        currency: liability.currency,
        balance: liability.balance,
        interestRate: liability.interestRate ?? undefined,
        minimumPayment: liability.minimumPayment ?? undefined,
        dueDate: liability.dueDate ? liability.dueDate.slice(0, 10) : undefined,
        creditCardId: liability.creditCardId ?? undefined,
        notes: liability.notes ?? undefined,
      });
    }
  }, [liability, reset]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b px-5 py-4 flex-shrink-0">
          <h2 className="text-sm font-medium">
            {liability ? "Edit liability" : "Add liability"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={LABEL_CLASS}>Name *</label>
              <input
                {...register("name")}
                className={INPUT_CLASS}
                placeholder="e.g. Credit card debt"
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS}>Type *</label>
              <select {...register("type")} className={INPUT_CLASS}>
                {LIABILITY_TYPES.map((t) => (
                  <option key={t} value={t}>{LIABILITY_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Currency *</label>
              <select {...register("currency")} className={INPUT_CLASS}>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Balance *</label>
              <input
                {...register("balance")}
                type="number"
                step="any"
                className={INPUT_CLASS}
                placeholder="0"
              />
              {errors.balance && (
                <p className="text-xs text-destructive mt-1">{errors.balance.message}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS}>Interest rate (%)</label>
              <input
                {...register("interestRate")}
                type="number"
                step="0.01"
                className={INPUT_CLASS}
                placeholder="e.g. 18.5"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Minimum payment</label>
              <input
                {...register("minimumPayment")}
                type="number"
                step="any"
                className={INPUT_CLASS}
                placeholder="0"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Due date</label>
              <input {...register("dueDate")} type="date" className={INPUT_CLASS} />
            </div>

            {selectedType === "CREDIT_CARD" && creditCards.length > 0 && (
              <div className="col-span-2">
                <label className={LABEL_CLASS}>Link to credit card</label>
                <select {...register("creditCardId")} className={INPUT_CLASS}>
                  <option value="">— None —</option>
                  {creditCards.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-span-2">
              <label className={LABEL_CLASS}>Notes</label>
              <textarea
                {...register("notes")}
                rows={2}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Optional notes..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-foreground text-background rounded-md px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50"
            >
              {isLoading ? "Saving..." : liability ? "Save changes" : "Add liability"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
