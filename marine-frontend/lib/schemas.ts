import { z } from "zod";

export const createQuoteSchema = z.object({
  classType: z.enum(["A", "B", "C"]),
  cargoType: z.string().min(1).max(100),
  cargoValue: z
    .number()
    .refine((v) => Number.isFinite(v) && v > 0, "cargoValue must be > 0 and finite"),
  origin: z.string().min(1).max(100),
  destination: z.string().min(1).max(100),
});

export const issuePolicySchema = z.object({
  quoteId: z.string().uuid(),
  customername: z.string().min(1).max(100),
});

export type CreateQuoteSchema = z.infer<typeof createQuoteSchema>;
export type IssuePolicySchema = z.infer<typeof issuePolicySchema>;
