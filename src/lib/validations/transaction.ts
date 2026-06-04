import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER", "ADJUSTMENT"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().min(3).max(3).toUpperCase(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  categoryId: z.string().cuid().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  merchant: z.string().max(200).optional().nullable(),
  creditCardId: z.string().cuid().optional().nullable(),
  accountId: z.string().cuid().optional().nullable(),
  isRecurring: z.boolean().optional().default(false),
  recurringRuleId: z.string().cuid().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const transactionUpdateSchema = transactionSchema.partial();

export const transactionFilterSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER", "ADJUSTMENT"]).optional(),
  categoryId: z.string().optional(),
  currency: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(25),
  sortBy: z.enum(["date", "amount", "createdAt"]).default("date"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransactionFilter = z.infer<typeof transactionFilterSchema>;

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string().max(50).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
