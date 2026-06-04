import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface LiabilityRow {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
  interestRate: number | null;
  minimumPayment: number | null;
  dueDate: string | null;
  creditCardId: string | null;
  notes: string | null;
  baseBalance: number;
  createdAt: string;
  creditCard: { id: string; name: string } | null;
}

export interface LiabilitiesResponse {
  liabilities: LiabilityRow[];
  totals: {
    totalDebt: number;
    totalMinPayments: number;
    creditUtilization: number;
    currency: string;
  };
}

export function useLiabilities() {
  return useQuery<LiabilitiesResponse>({
    queryKey: ["liabilities"],
    queryFn: async () => {
      const res = await fetch("/api/liabilities");
      if (!res.ok) throw new Error("Failed to fetch liabilities");
      return res.json();
    },
  });
}

export function useCreateLiability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/liabilities", {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["liabilities"] }),
  });
}

export function useUpdateLiability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown>) => {
      const res = await fetch(`/api/liabilities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update liability");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["liabilities"] }),
  });
}

export function useDeleteLiability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/liabilities/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete liability");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["liabilities"] }),
  });
}
