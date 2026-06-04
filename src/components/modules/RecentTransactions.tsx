import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface Tx {
  id: string;
  description: string;
  merchant: string;
  amount: number;
  currency: string;
  baseAmount: number;
  type: string;
  date: string;
  category: string | null;
  categoryIcon: string | null;
}

interface Props {
  transactions: Tx[];
  baseCurrency: string;
}

export function RecentTransactions({ transactions, baseCurrency }: Props) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">Recent transactions</p>
        <Link
          href="/dashboard/transactions"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No transactions yet.{" "}
          <Link href="/dashboard/transactions" className="underline">
            Add one
          </Link>
        </p>
      ) : (
        <div className="space-y-0 divide-y">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 py-2.5">
              {/* Category icon placeholder */}
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs",
                  tx.type === "INCOME"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                )}
              >
                {tx.type === "INCOME" ? "+" : "−"}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {tx.merchant || tx.description || "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(tx.date, "short")}
                  {tx.category ? ` · ${tx.category}` : ""}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    tx.type === "INCOME" ? "text-success" : "text-destructive"
                  )}
                >
                  {tx.type === "INCOME" ? "+" : "−"}
                  {formatCurrency(Math.abs(tx.amount), tx.currency)}
                </p>
                {tx.currency !== baseCurrency && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    ≈ {formatCurrency(Math.abs(tx.baseAmount), baseCurrency, true)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
