import { z } from "zod";

export const createQuoteSchema = z.object({
  classType: z.enum(["A", "B"]),
  cargoType: z.string().min(1).max(100),
  cargoValue: z
    .number()
    .refine((v) => Number.isFinite(v) && v > 0, "cargoValue must be > 0 and finite"),
  origin: z.string().min(1).max(100),
  destination: z.string().min(1).max(100),
});

export const issuePolicySchema = z
  .object({
    quoteId: z.string().uuid(),
    customerName: z.string().min(1, "Customer name is required").max(100),
    proformaInvoice: z.string().min(1, "Proforma invoice is required").max(200),
    mode: z.enum(["SEA", "AIR"], { errorMap: () => ({ message: "Mode is required" }) }),
    currency: z.enum(["USD", "GBP", "JPY", "EUR"], {
      errorMap: () => ({ message: "Currency is required" }),
    }),
    invoiceValue: z
      .number({ invalid_type_error: "Invoice value is required" })
      .refine((v) => Number.isFinite(v) && v > 0, "Must be > 0"),
    exchangeRate: z
      .number({ invalid_type_error: "Exchange rate is required" })
      .refine((v) => Number.isFinite(v) && v > 0, "Must be > 0"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((v) => new Date(v.endDate) >= new Date(v.startDate), {
    path: ["endDate"],
    message: "End date must be on or after start date",
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

const ratePercent = z
  .number({ invalid_type_error: "Rate is required" })
  .min(0, "Rate must be ≥ 0")
  .max(100, "Rate must be ≤ 100");

export const createUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  email: z.string().email("Enter a valid email").max(200),
  password: strongPassword,
  role: z.enum(["ADMIN", "STAFF", "USER"]),
  classARatePct: ratePercent,
  classBRatePct: ratePercent,
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;

export const userRatesSchema = z.object({
  classARatePct: ratePercent,
  classBRatePct: ratePercent,
});

export type UserRatesSchema = z.infer<typeof userRatesSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email").max(200),
});

export const forceChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "New password must differ from the current one",
  });

export type ForceChangePasswordSchema = z.infer<typeof forceChangePasswordSchema>;

export type LoginSchema = z.infer<typeof loginSchema>;
export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;
