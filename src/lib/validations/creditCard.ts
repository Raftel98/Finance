import { z } from "zod";

export const creditCardSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  issuer: z.string().max(200).optional().nullable(),
  creditLimit: z.coerce.number().positive("Credit limit must be positive"),
  currency: z.string().min(3).max(3).toUpperCase(),
  closingDay: z.coerce.number().int().min(1).max(31),
  paymentDay: z.coerce.number().int().min(1).max(31),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .optional()
    .nullable(),
  icon: z.string().max(100).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const creditCardUpdateSchema = creditCardSchema.partial();

export type CreditCardInput = z.infer<typeof creditCardSchema>;
export type CreditCardUpdateInput = z.infer<typeof creditCardUpdateSchema>;
