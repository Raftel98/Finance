import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface CreditCardRow {
  id: string;
  name: string;
  issuer: string | null;
  creditLimit: number;
  currency: string;
  closingDay: number;
  paymentDay: number;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  currentBalance: number;
  utilization: number;
  available: number;
  liabilityId: string | null;
  createdAt: string;
}

export interface CreditCardsResponse {
  cards: CreditCardRow[];
  totals: {
    totalLimit: number;
    totalBalance: number;
    totalAvailable: number;
    overallUtilization: number;
  };
}

export function useCreditCards() {
  return useQuery<CreditCardsResponse>({
    queryKey: ["credit-cards"],
    queryFn: async () => {
      const res = await fetch("/api/credit-cards");
      if (!res.ok) throw new Error("Failed to fetch credit cards");
      return res.json();
    },
  });
}

export function useCreateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/credit-cards", {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}

export function useUpdateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown>) => {
      const res = await fetch(`/api/credit-cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update credit card");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}

export function useDeleteCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/credit-cards/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete credit card");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["credit-cards"] }),
  });
}
