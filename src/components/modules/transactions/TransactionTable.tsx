"use client";

import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { TransactionRow } from "@/hooks/useTransactions";
import { useDeleteTransaction } from "@/hooks/useTransactions";
import { Pencil, Trash2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

interface Props {
  transactions: TransactionRow[];
  isLoading: boolean;
  baseCurrency: string;
  onEdit: (id: string) => void;
  page: number;
  pages: number;
  total: number;
  onPageChange: (p: number) => void;
}

const TYPE_STYLES: Record<string, string> = {
  INCOME: "bg-success/10 text-success",
  EXPENSE: "bg-destructive/10 text-destructive",
  TRANSFER: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  ADJUSTMENT: "bg-muted text-muted-foreground",
};

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: "manual",
  AI_EXTRACTED: "ai",
  BANK_SYNC: "sync",
};

export function TransactionTable({
  transactions,
  isLoading,
  baseCurrency,
  onEdit,
  page,
  pages,
  total,
  onPageChange,
}: Props) {
  const deleteMutation = useDeleteTransaction();

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">No transactions found.</p>
          <p className="text-xs mt-1">Try adjusting your filters or add a new transaction.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Base ({baseCurrency})</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Source</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/20 transition-colors group">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(tx.date, "short")}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="font-medium truncate">{tx.merchant || tx.description || "—"}</div>
                    {tx.merchant && tx.description && (
                      <div className="text-xs text-muted-foreground truncate">{tx.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {tx.category ? (
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
                        style={tx.category.color ? { borderColor: tx.category.color + "40", color: tx.category.color } : undefined}
                      >
                        {tx.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", TYPE_STYLES[tx.type])}>
                      {tx.type.toLowerCase()}
                    </span>
                  </td>
                  <td className={cn(
                    "px-4 py-3 text-right font-medium tabular-nums whitespace-nowrap",
                    tx.type === "INCOME" ? "text-success" : tx.type === "EXPENSE" ? "text-destructive" : ""
                  )}>
                    {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "−" : ""}
                    {formatCurrency(Math.abs(tx.amount), tx.currency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground text-xs whitespace-nowrap">
                    {tx.currency !== baseCurrency && tx.baseAmount
                      ? formatCurrency(Math.abs(tx.baseAmount), baseCurrency, true)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {SOURCE_LABELS[tx.source] ?? tx.source}
                    </span>
                    {tx.isRecurring && (
                      <span className="ml-1 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">↻</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(tx.id)}
                        className="rounded p-1 hover:bg-muted transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this transaction?")) {
                            deleteMutation.mutate(tx.id);
                          }
                        }}
                        className="rounded p-1 hover:bg-destructive/10 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-muted-foreground">
          {total} transaction{total !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="flex h-7 w-7 items-center justify-center rounded border text-xs hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {pages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= pages}
            className="flex h-7 w-7 items-center justify-center rounded border text-xs hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
