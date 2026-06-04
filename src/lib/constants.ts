// Client-safe constants — no server imports

export const SUPPORTED_CURRENCIES = ["COP", "USD", "EUR", "GBP", "MXN", "CRC"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_LABELS: Record<string, string> = {
  COP: "Colombian peso",
  USD: "US dollar",
  EUR: "Euro",
  GBP: "British pound",
  MXN: "Mexican peso",
  CRC: "Costa Rican colón",
};

export const TRANSACTION_TYPES = ["INCOME", "EXPENSE", "TRANSFER", "ADJUSTMENT"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const RECURRING_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

export const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};
