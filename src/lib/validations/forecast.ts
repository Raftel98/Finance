import { z } from "zod";

export const scenarioSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["BASE", "OPTIMISTIC", "CONSERVATIVE", "CUSTOM"]),
  isActive: z.boolean().default(false),
});

export const adjustmentSchema = z.object({
  scenarioId: z.string().cuid(),
  description: z.string().min(1).max(500),
  adjustmentType: z.enum([
    "INCOME_CHANGE",
    "EXPENSE_CHANGE",
    "NEW_EXPENSE",
    "ASSET_CHANGE",
    "DEBT_CHANGE",
  ]),
  impactAmount: z.coerce.number().optional().nullable(),
  impactPercent: z.coerce.number().optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  currency: z.string().min(3).max(3).toUpperCase().optional().nullable(),
});

export type ScenarioInput = z.infer<typeof scenarioSchema>;
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;
