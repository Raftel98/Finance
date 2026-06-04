import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface NetWorthSnapshot {
  id: string;
  snapshotDate: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  currency: string;
  assetBreakdown: Record<string, number> | null;
  liabilityBreakdown: Record<string, number> | null;
  currencyBreakdown: Record<string, { assets: number; liabilities: number }> | null;
}

export interface NetWorthCurrentSnapshot extends NetWorthSnapshot {
  momChange: number | null;
  momChangePct: number | null;
}

export interface NetWorthResponse {
  current: NetWorthCurrentSnapshot | null;
  history: NetWorthSnapshot[];
  baseCurrency: string;
}

export function useNetWorthHistory() {
  return useQuery<NetWorthResponse>({
    queryKey: ["net-worth"],
    queryFn: async () => {
      const res = await fetch("/api/net-worth");
      if (!res.ok) throw new Error("Failed to fetch net worth");
      return res.json();
    },
  });
}

export function useCreateSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/net-worth", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create snapshot");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["net-worth"] }),
  });
}
