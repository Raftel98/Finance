import { z } from "zod";

export const ASSET_TYPES = [
  "CASH",
  "CHECKING",
  "SAVINGS",
  "STOCKS",
  "ETF",
  "CRYPTO",
  "REAL_ESTATE",
  "VEHICLE",
  "OTHER",
] as const;

export const assetSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum(ASSET_TYPES),
  currency: z.string().min(3).max(3).toUpperCase(),
  currentValue: z.coerce.number().min(0, "Value must be non-negative"),
  purchaseValue: z.coerce.number().min(0).optional().nullable(),
  purchaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional()
    .nullable(),
  institution: z.string().max(200).optional().nullable(),
  accountNumber: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  isLiquid: z.boolean().default(false),
});

export const assetUpdateSchema = assetSchema.partial();

export type AssetInput = z.infer<typeof assetSchema>;
export type AssetUpdateInput = z.infer<typeof assetUpdateSchema>;
