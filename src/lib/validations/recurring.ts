import { z } from "zod";

export const recurringRuleSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive(),
  currency: z.string().min(3).max(3).toUpperCase(),
  categoryId: z.string().cuid().optional().nullable(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  dayOfMonth: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().min(1).max(31).nullable().optional()
  ),
  dayOfWeek: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().min(0).max(6).nullable().optional()
  ),
  isActive: z.boolean().default(true),
});

export type RecurringRuleInput = z.infer<typeof recurringRuleSchema>;
