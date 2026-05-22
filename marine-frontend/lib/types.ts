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

export type UserRole = "ADMIN" | "STAFF" | "USER";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  wallet: number;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: AuthUser;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface QuoteListResponse {
  data: Quote[];
  pagination: Pagination;
}

export interface PolicyListResponse {
  data: Policy[];
  pagination: Pagination;
}

export interface WalletBalanceResponse {
  id: string;
  fullName: string;
  wallet: number;
}
