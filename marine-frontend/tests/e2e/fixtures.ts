export const FIXTURE_QUOTE_ID = "11111111-2222-4333-8444-555555555555";

export const FIXTURE_QUOTE = {
  id: FIXTURE_QUOTE_ID,
  classType: "B" as const,
  cargoType: "electronics",
  cargoValue: 1000,
  origin: "Lagos",
  destination: "Rotterdam",
  premium: 7,
  createdAt: "2026-05-02T00:00:00.000Z",
};

export const FIXTURE_POLICY = {
  id: "policy-1",
  policyNumber: "POL-1234567890",
  quoteId: FIXTURE_QUOTE_ID,
  customername: "Acme Logistics",
  status: "active",
  createdAt: "2026-05-02T00:00:01.000Z",
};
