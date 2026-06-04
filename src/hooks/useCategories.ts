"use client";

import { useQuery } from "@tanstack/react-query";

export interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  parentId: string | null;
}

export function useCategories(type?: "INCOME" | "EXPENSE") {
  return useQuery({
    queryKey: ["categories", type],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data: { categories: Category[] } = await res.json();
      return type ? data.categories.filter((c) => c.type === type) : data.categories;
    },
    staleTime: 5 * 60 * 1000,
  });
}
