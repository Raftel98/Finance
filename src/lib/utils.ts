import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Number Formatting ────────────────────────────────────────────────────────

const LOCALE = "es-CO";

export function formatCurrency(
  amount: number,
  currency = "COP",
  compact = false
): string {
  if (compact && Math.abs(amount) >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${currency} ${m.toLocaleString(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
  }
  if (compact && Math.abs(amount) >= 1_000) {
    const k = amount / 1_000;
    return `${currency} ${k.toLocaleString(LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}K`;
  }
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === "COP" ? 0 : 2,
  }).format(amount);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000)
    return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(amount) >= 1_000_000)
    return `${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000)
    return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toFixed(0);
}

// ─── Date ─────────────────────────────────────────────────────────────────────

export function formatDate(date: Date | string, format: "short" | "medium" | "long" = "medium"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const opts: Intl.DateTimeFormatOptions =
    format === "short"
      ? { day: "2-digit", month: "2-digit" }
      : format === "medium"
      ? { day: "numeric", month: "short", year: "numeric" }
      : { day: "numeric", month: "long", year: "numeric" };
  return d.toLocaleDateString(LOCALE, opts);
}

export function formatMonthYear(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE, { month: "short", year: "numeric" });
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
