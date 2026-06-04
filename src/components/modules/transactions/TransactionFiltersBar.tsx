"use client";

import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { SUPPORTED_CURRENCIES } from "@/lib/constants";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  filters: Record<string, string>;
  onChange: (filters: Record<string, string>) => void;
}

const TYPES = [
  { value: "", label: "All" },
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
  { value: "TRANSFER", label: "Transfer" },
];

export function TransactionFiltersBar({ filters, onChange }: Props) {
  const { data: categories = [] } = useCategories();
  const [searchInput, setSearchInput] = useState(filters.search ?? "");

  function set(key: string, value: string) {
    const next = { ...filters };
    if (value) next[key] = value;
    else delete next[key];
    onChange(next);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") set("search", searchInput);
  }

  const hasFilters = Object.keys(filters).length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Type tabs */}
      <div className="flex rounded-md border overflow-hidden">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => set("type", t.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              (filters.type ?? "") === t.value
                ? "bg-foreground text-background"
                : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Category */}
      <select
        value={filters.categoryId ?? ""}
        onChange={(e) => set("categoryId", e.target.value)}
        className="h-8 rounded-md border bg-card px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">Category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Currency */}
      <select
        value={filters.currency ?? ""}
        onChange={(e) => set("currency", e.target.value)}
        className="h-8 rounded-md border bg-card px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">Currency</option>
        {SUPPORTED_CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {/* Date range */}
      <input
        type="date"
        value={filters.from ?? ""}
        onChange={(e) => set("from", e.target.value)}
        className="h-8 rounded-md border bg-card px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="From"
      />
      <input
        type="date"
        value={filters.to ?? ""}
        onChange={(e) => set("to", e.target.value)}
        className="h-8 rounded-md border bg-card px-2 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="To"
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          onBlur={() => set("search", searchInput)}
          placeholder="Search…"
          className="h-8 w-36 rounded-md border bg-card pl-6 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={() => { onChange({}); setSearchInput(""); }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" /> Clear
        </button>
      )}
    </div>
  );
}
