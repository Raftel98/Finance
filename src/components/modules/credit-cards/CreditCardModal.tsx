"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { creditCardSchema, CreditCardInput } from "@/lib/validations/creditCard";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import type { CreditCardRow } from "@/hooks/useCreditCards";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#1a1a2e", // dark navy
  "#16213e", // midnight blue
  "#0f3460", // cobalt
  "#533483", // purple
  "#2d6a4f", // forest green
  "#c0392b", // crimson
];

interface CreditCardModalProps {
  card?: CreditCardRow | null;
  onClose: () => void;
  onSubmit: (data: CreditCardInput) => Promise<void>;
  isLoading?: boolean;
}

const INPUT_CLASS =
  "w-full h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const LABEL_CLASS = "block text-xs font-medium text-muted-foreground mb-1";

export function CreditCardModal({ card, onClose, onSubmit, isLoading }: CreditCardModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreditCardInput>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      name: "",
      creditLimit: 0,
      currency: "COP",
      closingDay: 25,
      paymentDay: 5,
      isActive: true,
      color: PRESET_COLORS[0],
    },
  });

  const selectedColor = watch("color");

  useEffect(() => {
    if (card) {
      reset({
        name: card.name,
        issuer: card.issuer ?? undefined,
        creditLimit: card.creditLimit,
        currency: card.currency,
        closingDay: card.closingDay,
        paymentDay: card.paymentDay,
        color: card.color ?? PRESET_COLORS[0],
        isActive: card.isActive,
      });
    }
  }, [card, reset]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border bg-card shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b px-5 py-4 flex-shrink-0">
          <h2 className="text-sm font-medium">
            {card ? "Edit credit card" : "Add credit card"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={LABEL_CLASS}>Card name *</label>
              <input
                {...register("name")}
                className={INPUT_CLASS}
                placeholder="e.g. Visa Signature"
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS}>Issuer</label>
              <input
                {...register("issuer")}
                className={INPUT_CLASS}
                placeholder="e.g. Bancolombia"
              />
            </div>

            <div>
              <label className={LABEL_CLASS}>Currency *</label>
              <select {...register("currency")} className={INPUT_CLASS}>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className={LABEL_CLASS}>Credit limit *</label>
              <input
                {...register("creditLimit")}
                type="number"
                step="any"
                className={INPUT_CLASS}
                placeholder="0"
              />
              {errors.creditLimit && (
                <p className="text-xs text-destructive mt-1">{errors.creditLimit.message}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS}>Closing day (1–31) *</label>
              <input
                {...register("closingDay")}
                type="number"
                min={1}
                max={31}
                className={INPUT_CLASS}
              />
              {errors.closingDay && (
                <p className="text-xs text-destructive mt-1">{errors.closingDay.message}</p>
              )}
            </div>

            <div>
              <label className={LABEL_CLASS}>Payment day (1–31) *</label>
              <input
                {...register("paymentDay")}
                type="number"
                min={1}
                max={31}
                className={INPUT_CLASS}
              />
              {errors.paymentDay && (
                <p className="text-xs text-destructive mt-1">{errors.paymentDay.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <label className={LABEL_CLASS}>Card color</label>
              <div className="flex items-center gap-2 mt-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setValue("color", color)}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-all",
                      selectedColor === color
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  {...register("color")}
                  type="color"
                  className="h-7 w-7 rounded cursor-pointer border"
                  title="Custom color"
                />
              </div>
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <input
                {...register("isActive")}
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border"
              />
              <label htmlFor="isActive" className="text-sm text-muted-foreground cursor-pointer">
                Card is active
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
              {isLoading ? "Saving..." : card ? "Save changes" : "Add card"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
