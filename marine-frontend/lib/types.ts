export type QuoteClassType = "A" | "B" | "C";

export type QuoteStatus = "GENERATED" | "CONVERTED" | "EXPIRED";

export interface Quote {
  id: string;
  classType: QuoteClassType;
  cargoType: string;
  cargoValue: number;
  origin: string;
  destination: string;
  premium: number;
  status: QuoteStatus;
  createdAt: string;
}

export interface Policy {
  id: string;
  policyNumber: string;
  quoteId: string;
  customerName: string;
  status: string;
  createdAt: string;
  quote?: Quote;
  issuedById?: string;
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
  customerName: string;
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

export interface UserListItem {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface UserListResponse {
  data: UserListItem[];
  pagination: Pagination;
}

export interface QuoteCounts {
  ALL: number;
  GENERATED: number;
  CONVERTED: number;
  EXPIRED: number;
}

export interface PolicyCounts {
  ALL: number;
  PENDING_APPROVAL: number;
  APPROVED: number;
  REJECTED: number;
}

export interface UserCounts {
  ALL: number;
  ADMIN: number;
  STAFF: number;
  USER: number;
}
