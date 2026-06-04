"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface TransactionRow {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER" | "ADJUSTMENT";
  amount: number;
  currency: string;
  baseAmount: number | null;
  exchangeRate: number | null;
  date: string;
  description: string | null;
  merchant: string | null;
  notes: string | null;
  isRecurring: boolean;
  source: string;
  categoryId: string | null;
  creditCardId: string | null;
  category: { id: string; name: string; icon: string | null; color: string | null } | null;
}

export interface TransactionFilters {
  type?: string;
  categoryId?: string;
  currency?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface TransactionListResponse {
  transactions: TransactionRow[];
  total: number;
  pages: number;
  summary: { totalIncome: number; totalExpenses: number };
}

async function fetchTransactions(filters: TransactionFilters): Promise<TransactionListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v));
  });
  const res = await fetch(`/api/transactions?${params}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => fetchTransactions(filters),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err.error));
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown>) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["transactions"] }),
  });
}
