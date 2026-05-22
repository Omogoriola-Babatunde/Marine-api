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
  customerName: z.string().min(1).max(100),
});

export type CreateQuoteSchema = z.infer<typeof createQuoteSchema>;
export type IssuePolicySchema = z.infer<typeof issuePolicySchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email").max(200),
  password: z.string().min(1, "Password is required"),
});

export const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password must be at most 200 characters")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/\d/, "Password must contain a number")
  .regex(/[^A-Za-z0-9]/, "Password must contain a special character");

export const createUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  email: z.string().email("Enter a valid email").max(200),
  password: strongPassword,
  role: z.enum(["ADMIN", "STAFF", "USER"]),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email").max(200),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
