export type QuoteClassType = "A" | "B" | "C";

export interface Quote {
  id: string;
  classType: QuoteClassType;
  cargoType: string;
  cargoValue: number;
  origin: string;
  destination: string;
  premium: number;
  createdAt: string;
}

export interface Policy {
  id: string;
  policyNumber: string;
  quoteId: string;
  customername: string;
  status: string;
  createdAt: string;
}

export interface CreateQuoteInput {
  classType: QuoteClassType;
  cargoType: string;
  cargoValue: number;
  origin: string;
  destination: string;
}

export interface IssuePolicyInput {
  quoteId: string;
  customername: string;
}

export interface IssuePolicyResponse {
  policy: Policy;
  certificatePath: string;
}

export interface ApiErrorResponse {
  errors?: string[];
  error?: string;
}
