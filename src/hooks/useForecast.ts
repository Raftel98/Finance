"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface MonthProjection {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
  cashFlow: number;
  cumulativeSavings: number;
  projectedNetWorth: number;
  projectedDebt: number;
}

export interface ScenarioAdjustment {
  id: string;
  scenarioId: string;
  description: string;
  adjustmentType: string;
  impactAmount: number | null;
  impactPercent: number | null;
  startDate: string;
  endDate: string | null;
  currency: string | null;
}

export interface ForecastScenario {
  id: string;
  name: string;
  type: "BASE" | "OPTIMISTIC" | "CONSERVATIVE" | "CUSTOM";
  isActive: boolean;
  adjustments: ScenarioAdjustment[];
}

export function useForecast(months = 12, scenarioId?: string) {
  const params = new URLSearchParams({ months: String(months) });
  if (scenarioId) params.set("scenarioId", scenarioId);
  return useQuery<{ projections: MonthProjection[] }>({
    queryKey: ["forecast", months, scenarioId],
    queryFn: async () => {
      const res = await fetch(`/api/forecast?${params}`);
      if (!res.ok) throw new Error("Failed to fetch forecast");
      return res.json();
    },
  });
}

export function useScenarios() {
  return useQuery<{ scenarios: ForecastScenario[] }>({
    queryKey: ["forecast-scenarios"],
    queryFn: async () => {
      const res = await fetch("/api/forecast/scenarios");
      if (!res.ok) throw new Error("Failed to fetch scenarios");
      return res.json();
    },
  });
}

export function useCreateScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; type: string; isActive?: boolean }) => {
      const res = await fetch("/api/forecast/scenarios", {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forecast-scenarios"] }),
  });
}

export function useDeleteScenario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/forecast/scenarios/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete scenario");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forecast-scenarios"] }),
  });
}

export function useCreateAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      scenarioId: string;
      description: string;
      adjustmentType: string;
      impactAmount?: number | null;
      impactPercent?: number | null;
      startDate: string;
      endDate?: string | null;
      currency?: string | null;
    }) => {
      const { scenarioId, ...rest } = data;
      const res = await fetch(`/api/forecast/scenarios/${scenarioId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err.error));
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forecast-scenarios"] }),
  });
}

export function useDeleteAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/forecast/adjustments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete adjustment");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forecast-scenarios"] }),
  });
}
