"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { assetSchema, AssetInput, ASSET_TYPES } from "@/lib/validations/asset";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import type { AssetRow } from "@/hooks/useAssets";

const ASSET_TYPE_LABELS: Record<string, string> = {
  CASH: "Cash",
  CHECKING: "Checking account",
  SAVINGS: "Savings account",
  STOCKS: "Stocks",
  ETF: "ETF",
  CRYPTO: "Cryptocurrency",
  REAL_ESTATE: "Real estate",
  VEHICLE: "Vehicle",
  OTHER: "Other",
};

interface AssetModalProps {
  asset?: AssetRow | null;
  onClose: () => void;
  onSubmit: (data: AssetInput) => Promise<void>;
  isLoading?: boolean;
}

const INPUT_CLASS =
  "w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const LABEL_CLASS = "block text-xs font-medium text-muted-foreground mb-1";

export function AssetModal({ asset, onClose, onSubmit, isLoading }: AssetModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssetInput>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      name: "",
      type: "CASH",
      currency: "COP",
      currentValue: 0,
      isLiquid: false,
    },
  });

  useEffect(() => {
    if (asset) {
      reset({
        name: asset.name,
        type: asset.type as AssetInput["type"],
        currency: asset.currency,
        currentValue: asset.currentValue,
        purchaseValue: asset.purchaseValue ?? undefined,
        purchaseDate: asset.purchaseDate
          ? asset.purchaseDate.slice(0, 10)
          : undefined,
        institution: asset.institution ?? undefined,
        accountNumber: asset.accountNumber ?? undefined,
        notes: asset.notes ?? undefined,
        isLiquid: asset.isLiquid,
      });
    }
  }, [asset, reset]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b px-5 py-4 flex-shrink-0">
          <h2 className="text-sm font-medium">{asset ? "Edit asset" : "Add asset"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-5 space-y-4 overflow-y-auto"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={LABEL_CLASS}>Name *</label>
              <input {...register("name")} className={INPUT_CLASS} placeholder="e.g. Emergency fund" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className={LABEL_CLASS}>Type *</label>
              <select {...register("type")} className={INPUT_CLASS}>
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>{ASSET_TYPE_LABELS[t]}</option>
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
              <label className={LABEL_CLASS}>Current value *</label>
              <input
                {...register("currentValue")}
                type="number"
                step="any"
                className={INPUT_CLASS}
                placeholder="0"
              />
              {errors.currentValue && (
                <p className="text-xs text-destructive mt-1">{errors.currentValue.message}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS}>Purchase value</label>
              <input
                {...register("purchaseValue")}
                type="number"
                step="any"
                className={INPUT_CLASS}
                placeholder="0"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Purchase date</label>
              <input {...register("purchaseDate")} type="date" className={INPUT_CLASS} />
            </div>

            <div>
              <label className={LABEL_CLASS}>Institution</label>
              <input
                {...register("institution")}
                className={INPUT_CLASS}
                placeholder="e.g. Bancolombia"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Account number</label>
              <input
                {...register("accountNumber")}
                className={INPUT_CLASS}
                placeholder="Last 4 digits"
              />
            </div>

            <div className="col-span-2">
              <label className={LABEL_CLASS}>Notes</label>
              <textarea
                {...register("notes")}
                rows={2}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Optional notes..."
              />
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <input
                {...register("isLiquid")}
                type="checkbox"
                id="isLiquid"
                className="h-4 w-4 rounded border"
              />
              <label htmlFor="isLiquid" className="text-sm text-muted-foreground cursor-pointer">
                Liquid asset (can be quickly converted to cash)
              </label>
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
              {isLoading ? "Saving..." : asset ? "Save changes" : "Add asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
