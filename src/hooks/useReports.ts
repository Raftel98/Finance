"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReportData } from "@/services/report";

export function useReportData(type: string, year: number, month?: number) {
  const params = new URLSearchParams({ type, year: String(year) });
  if (month !== undefined) params.set("month", String(month));

  return useQuery<{ report: ReportData }>({
    queryKey: ["report", type, year, month],
    queryFn: async () => {
      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
  });
}

export function useRecentReports() {
  return useQuery<{ reports: unknown[] }>({
    queryKey: ["reports-list"],
    queryFn: async () => {
      const res = await fetch("/api/reports");
      if (!res.ok) throw new Error("Failed to fetch reports");
      return res.json();
    },
  });
}
