export type QuoteClassType = "A" | "B";

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
  issuedBy?: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
  };
  proformaInvoice?: string | null;
  mode?: ShipmentMode | null;
  currency?: PolicyCurrency | null;
  invoiceValue?: number | null;
  exchangeRate?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  naicomId?: string | null;
}

export interface CreateQuoteInput {
  classType: QuoteClassType;
  cargoType: string;
  cargoValue: number;
  origin: string;
  destination: string;
}

export type ShipmentMode = "SEA" | "AIR";
export type PolicyCurrency = "USD" | "GBP" | "JPY" | "EUR";

export interface IssuePolicyInput {
  quoteId: string;
  customerName: string;
  proformaInvoice: string;
  mode: ShipmentMode;
  currency: PolicyCurrency;
  invoiceValue: number;
  exchangeRate: number;
  startDate: string;
  endDate: string;
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
  classARate: number;
  classBRate: number;
  mustChangePassword: boolean;
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

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  role?: UserRole;
  classARate: number;
  classBRate: number;
}

export interface UpdateUserRatesInput {
  classARate: number;
  classBRate: number;
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
  classARate: number;
  classBRate: number;
}

export interface UserListResponse {
  data: UserListItem[];
  pagination: Pagination;
}

export interface QuoteClassBucket {
  count: number;
  premium: number;
  cargoValue: number;
}

export interface QuoteCounts {
  ALL: number;
  GENERATED: number;
  CONVERTED: number;
  EXPIRED: number;
  byClass: { A: QuoteClassBucket; B: QuoteClassBucket };
  totalPremium: number;
}

export interface TimeseriesPoint {
  date: string;
  count: number;
}

export interface TimeseriesResponse {
  days: number;
  data: TimeseriesPoint[];
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
