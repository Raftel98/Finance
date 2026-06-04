"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { TransactionFiltersBar } from "./TransactionFiltersBar";
import { TransactionTable } from "./TransactionTable";
import { TransactionModal } from "./TransactionModal";
import { RecurringRulesPanel } from "./RecurringRulesPanel";
import { MetricCard } from "@/components/ui/MetricCard";
import { cn, formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Props {
  baseCurrency: string;
}

type Tab = "transactions" | "recurring";

export function TransactionsClient({ baseCurrency }: Props) {
  const [tab, setTab] = useState<Tab>("transactions");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useTransactions({ ...filters, page, limit: 25 });

  const income = data?.summary.totalIncome ?? 0;
  const expenses = data?.summary.totalExpenses ?? 0;
  const net = income - expenses;

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b">
        {(["transactions", "recurring"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "transactions" ? "Transactions" : "Recurring rules"}
          </button>
        ))}
      </div>

      {tab === "recurring" ? (
        <RecurringRulesPanel baseCurrency={baseCurrency} />
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <MetricCard
              label="Income (filtered)"
              value={formatCurrency(income, baseCurrency, true)}
              trend="up"
            />
            <MetricCard
              label="Expenses (filtered)"
              value={formatCurrency(expenses, baseCurrency, true)}
              trend="down"
            />
            <MetricCard
              label="Net (filtered)"
              value={formatCurrency(net, baseCurrency, true)}
              trend={net >= 0 ? "up" : "down"}
            />
          </div>

          {/* Filters + Add button */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <TransactionFiltersBar
              filters={filters}
              onChange={(f) => { setFilters(f); setPage(1); }}
            />
            <button
              onClick={() => { setEditingId(null); setModalOpen(true); }}
              className="flex shrink-0 items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:bg-foreground/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add transaction
            </button>
          </div>

          {/* Table */}
          <TransactionTable
            transactions={data?.transactions ?? []}
            isLoading={isLoading}
            baseCurrency={baseCurrency}
            onEdit={(id) => { setEditingId(id); setModalOpen(true); }}
            page={page}
            pages={data?.pages ?? 1}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />

          {/* Add / Edit modal */}
          {modalOpen && (
            <TransactionModal
              editingId={editingId}
              baseCurrency={baseCurrency}
              onClose={() => setModalOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
