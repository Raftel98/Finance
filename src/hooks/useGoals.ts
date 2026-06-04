"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface GoalRow {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currency: string;
  deadline: string | null;
  currentAmount: number;
  computedAmount: number;
  trackingType: string;
  assetId: string | null;
  notes: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  progressPct: number;
  projectedCompletionDate: string | null;
}

export function useGoals() {
  return useQuery<GoalRow[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Failed to fetch goals");
      return res.json();
    },
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/goals", {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown>) => {
      const res = await fetch(`/api/goals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update goal");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete goal");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
}
