import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AssetRow {
  id: string;
  name: string;
  type: string;
  currency: string;
  currentValue: number;
  purchaseValue: number | null;
  purchaseDate: string | null;
  institution: string | null;
  accountNumber: string | null;
  notes: string | null;
  isLiquid: boolean;
  baseValue: number;
  exchangeRate: number;
  unrealizedGain: number | null;
  unrealizedGainPct: number | null;
  createdAt: string;
}

export interface AssetsResponse {
  assets: AssetRow[];
  totals: {
    totalAssets: number;
    totalLiquid: number;
    currency: string;
  };
}

export function useAssets() {
  return useQuery<AssetsResponse>({
    queryKey: ["assets"],
    queryFn: async () => {
      const res = await fetch("/api/assets");
      if (!res.ok) throw new Error("Failed to fetch assets");
      return res.json();
    },
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/assets", {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown>) => {
      const res = await fetch(`/api/assets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update asset");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete asset");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["assets"] }),
  });
}
