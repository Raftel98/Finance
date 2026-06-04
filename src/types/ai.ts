// Shared AI extraction types — safe for both server and client
export interface ExtractedTransaction {
  date: string;
  description: string;
  merchant: string;
  amount: number;
  currency: string;
  type: "INCOME" | "EXPENSE";
  suggestedCategory: string;
  confidence: number;
}
