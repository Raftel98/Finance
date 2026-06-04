"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface BudgetRow {
  budget: {
    id: string;
    userId: string;
    categoryId: string;
    period: string;
    year: number;
    month: number | null;
    projectedAmount: number;
    currency: string;
    notes: string | null;
    category: {
      id: string;
      name: string;
      icon: string | null;
      color: string | null;
      type: string;
    };
  };
  actualSpending: number;
  variance: number;
  variancePct: number;
  progressPct: number;
}

export function useBudgets(year?: number, month?: number) {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  if (month) params.set("month", String(month));

  return useQuery<BudgetRow[]>({
    queryKey: ["budgets", year, month],
    queryFn: async () => {
      const res = await fetch(`/api/budgets?${params}`);
      if (!res.ok) throw new Error("Failed to fetch budgets");
      return res.json();
    },
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/budgets", {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown>) => {
      const res = await fetch(`/api/budgets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update budget");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete budget");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });
}
