"use client";

import { useState } from "react";
import { PlusCircle, Pencil, Trash2, CreditCard } from "lucide-react";
import { MetricCard } from "@/components/ui/MetricCard";
import { CreditCardModal } from "./CreditCardModal";
import {
  useCreditCards,
  useCreateCreditCard,
  useUpdateCreditCard,
  useDeleteCreditCard,
} from "@/hooks/useCreditCards";
import type { CreditCardRow, CreditCardsResponse } from "@/hooks/useCreditCards";
import { formatCurrency, cn } from "@/lib/utils";
import type { CreditCardInput } from "@/lib/validations/creditCard";

interface CreditCardsClientProps {
  initialData: CreditCardsResponse;
  baseCurrency: string;
}

export function CreditCardsClient({ initialData, baseCurrency }: CreditCardsClientProps) {
  const { data = initialData, isLoading } = useCreditCards();
  const createCard = useCreateCreditCard();
  const updateCard = useUpdateCreditCard();
  const deleteCard = useDeleteCreditCard();

  const [modal, setModal] = useState<{ open: boolean; card?: CreditCardRow | null }>({
    open: false,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { cards, totals } = data;

  async function handleSubmit(formData: CreditCardInput) {
    if (modal.card) {
      await updateCard.mutateAsync({ id: modal.card.id, ...formData });
    } else {
      await createCard.mutateAsync(formData);
    }
    setModal({ open: false });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this credit card?")) return;
    setDeletingId(id);
    try {
      await deleteCard.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total limit"
          value={formatCurrency(totals.totalLimit, baseCurrency, true)}
          sub={`${cards.length} card${cards.length !== 1 ? "s" : ""}`}
        />
        <MetricCard
          label="Total balance"
          value={formatCurrency(totals.totalBalance, baseCurrency, true)}
          trend={totals.totalBalance > 0 ? "down" : "neutral"}
        />
        <MetricCard
          label="Available credit"
          value={formatCurrency(totals.totalAvailable, baseCurrency, true)}
          trend="up"
        />
        <MetricCard
          label="Utilization"
          value={`${totals.overallUtilization.toFixed(1)}%`}
          trend={totals.overallUtilization > 30 ? "down" : "neutral"}
          sub={totals.overallUtilization > 30 ? "High — aim for < 30%" : "Healthy"}
        />
      </div>

      {/* Header + Add button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Your cards</h3>
        <button
          onClick={() => setModal({ open: true, card: null })}
          className="bg-foreground text-background rounded-md px-3 py-1.5 text-sm font-medium hover:bg-foreground/90 flex items-center gap-1.5"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Add card
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading cards...</div>
      )}

      {!isLoading && cards.length === 0 && (
        <div className="rounded-xl border bg-card p-12 text-center">
          <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No credit cards yet.</p>
          <button
            onClick={() => setModal({ open: true, card: null })}
            className="mt-3 bg-foreground text-background rounded-md px-3 py-1.5 text-sm font-medium hover:bg-foreground/90"
          >
            Add your first card
          </button>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className="rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Colored header */}
            <div
              className="px-5 py-4 text-white relative"
              style={{ backgroundColor: card.color ?? "#1a1a2e" }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{card.name}</p>
                  {card.issuer && (
                    <p className="text-xs opacity-75 mt-0.5">{card.issuer}</p>
                  )}
                </div>
                <CreditCard className="h-5 w-5 opacity-60" />
              </div>
              <div className="mt-3">
                <p className="text-xs opacity-75">Balance</p>
                <p className="text-lg font-medium tabular-nums">
                  {formatCurrency(card.currentBalance, card.currency)}
                </p>
              </div>
              {/* Actions overlay */}
              <div className="absolute top-3 right-10 flex gap-1">
                <button
                  onClick={() => setModal({ open: true, card })}
                  className="p-1 rounded bg-white/20 hover:bg-white/30 text-white"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDelete(card.id)}
                  disabled={deletingId === card.id}
                  className="p-1 rounded bg-white/20 hover:bg-red-500/60 text-white"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Card body */}
            <div className="px-5 py-4 space-y-3">
              {/* Utilization progress */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Utilization</span>
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      card.utilization > 30 ? "text-destructive" : "text-success"
                    )}
                  >
                    {card.utilization.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      card.utilization > 30 ? "bg-destructive" : "bg-success"
                    )}
                    style={{ width: `${Math.min(card.utilization, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Limit</p>
                  <p className="font-medium tabular-nums mt-0.5">
                    {formatCurrency(card.creditLimit, card.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Available</p>
                  <p className="font-medium tabular-nums mt-0.5 text-success">
                    {formatCurrency(card.available, card.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Closing day</p>
                  <p className="font-medium mt-0.5">Day {card.closingDay}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment day</p>
                  <p className="font-medium mt-0.5">Day {card.paymentDay}</p>
                </div>
              </div>

              {!card.isActive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                  Inactive
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {modal.open && (
        <CreditCardModal
          card={modal.card}
          onClose={() => setModal({ open: false })}
          onSubmit={handleSubmit}
          isLoading={createCard.isPending || updateCard.isPending}
        />
      )}
    </div>
  );
}
