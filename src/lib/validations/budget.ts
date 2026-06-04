import { z } from "zod";

export const budgetSchema = z.object({
  categoryId: z.string().cuid(),
  period: z.enum(["MONTHLY", "ANNUAL"]),
  year: z.coerce.number().min(2020).max(2099),
  month: z.coerce.number().min(1).max(12).optional().nullable(),
  projectedAmount: z.coerce.number().positive(),
  currency: z.string().min(3).max(3).toUpperCase(),
  notes: z.string().optional().nullable(),
});

export const budgetUpdateSchema = budgetSchema.partial();

export type BudgetInput = z.infer<typeof budgetSchema>;
export type BudgetUpdateInput = z.infer<typeof budgetUpdateSchema>;
