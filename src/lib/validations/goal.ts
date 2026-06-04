import { z } from "zod";

export const goalSchema = z.object({
  name: z.string().min(1).max(200),
  targetAmount: z.coerce.number().positive(),
  currency: z.string().min(3).max(3).toUpperCase(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  trackingType: z.enum(["NET_WORTH", "SAVINGS", "ASSET", "MANUAL"]),
  assetId: z.string().cuid().optional().nullable(),
  currentAmount: z.coerce.number().min(0).optional(),
  notes: z.string().optional().nullable(),
});

export const goalUpdateSchema = goalSchema.partial();

export type GoalInput = z.infer<typeof goalSchema>;
export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>;
