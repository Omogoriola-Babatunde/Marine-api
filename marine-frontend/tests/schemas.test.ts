import { describe, expect, it } from "vitest";
import { createQuoteSchema, issuePolicySchema } from "@/lib/schemas";

describe("createQuoteSchema", () => {
  const valid = {
    classType: "A" as const,
    cargoType: "electronics",
    cargoValue: 1000,
    origin: "Lagos",
    destination: "Rotterdam",
  };

  it("accepts a valid quote input", () => {
    expect(createQuoteSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects classType outside A|B|C", () => {
    const r = createQuoteSchema.safeParse({ ...valid, classType: "D" });
    expect(r.success).toBe(false);
  });

  it("rejects cargoValue <= 0", () => {
    expect(createQuoteSchema.safeParse({ ...valid, cargoValue: 0 }).success).toBe(false);
    expect(createQuoteSchema.safeParse({ ...valid, cargoValue: -5 }).success).toBe(false);
  });

  it("rejects non-finite cargoValue (NaN, Infinity)", () => {
    expect(createQuoteSchema.safeParse({ ...valid, cargoValue: Number.NaN }).success).toBe(false);
    expect(
      createQuoteSchema.safeParse({ ...valid, cargoValue: Number.POSITIVE_INFINITY }).success
    ).toBe(false);
  });

  it("rejects cargoType > 100 chars", () => {
    const r = createQuoteSchema.safeParse({ ...valid, cargoType: "x".repeat(101) });
    expect(r.success).toBe(false);
  });

  it("rejects empty cargoType", () => {
    expect(createQuoteSchema.safeParse({ ...valid, cargoType: "" }).success).toBe(false);
  });

  it("rejects origin/destination > 100 chars", () => {
    expect(createQuoteSchema.safeParse({ ...valid, origin: "x".repeat(101) }).success).toBe(false);
    expect(createQuoteSchema.safeParse({ ...valid, destination: "x".repeat(101) }).success).toBe(
      false
    );
  });
});

describe("issuePolicySchema", () => {
  const valid = {
    quoteId: "550e8400-e29b-41d4-a716-446655440000",
    customername: "Acme Logistics",
  };

  it("accepts a valid policy input", () => {
    expect(issuePolicySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects non-UUID quoteId", () => {
    expect(issuePolicySchema.safeParse({ ...valid, quoteId: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects empty customername", () => {
    expect(issuePolicySchema.safeParse({ ...valid, customername: "" }).success).toBe(false);
  });

  it("rejects customername > 100 chars", () => {
    expect(
      issuePolicySchema.safeParse({ ...valid, customername: "x".repeat(101) }).success
    ).toBe(false);
  });
});
