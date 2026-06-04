import { z } from "zod";

export const LIABILITY_TYPES = [
  "CREDIT_CARD",
  "PERSONAL_LOAN",
  "MORTGAGE",
  "VEHICLE_LOAN",
  "STUDENT_LOAN",
  "OTHER",
] as const;

export const liabilitySchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum(LIABILITY_TYPES),
  currency: z.string().min(3).max(3).toUpperCase(),
  balance: z.coerce.number().min(0, "Balance must be non-negative"),
  interestRate: z.coerce.number().min(0).max(100).optional().nullable(),
  minimumPayment: z.coerce.number().min(0).optional().nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional()
    .nullable(),
  creditCardId: z.string().cuid().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const liabilityUpdateSchema = liabilitySchema.partial();

export type LiabilityInput = z.infer<typeof liabilitySchema>;
export type LiabilityUpdateInput = z.infer<typeof liabilityUpdateSchema>;
