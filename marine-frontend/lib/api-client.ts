import { clearToken, getToken } from "@/lib/auth";
import type {
  ApiErrorResponse,
  CreateQuoteInput,
  ForgotPasswordInput,
  ForgotPasswordResponse,
  IssuePolicyInput,
  IssuePolicyResponse,
  LoginInput,
  LoginResponse,
  Pagination,
  Policy,
  PolicyListResponse,
  Quote,
  QuoteListResponse,
  WalletBalanceResponse,
} from "@/lib/types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errors?: string[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let body: ApiErrorResponse | null = null;
  try {
    body = (await res.json()) as ApiErrorResponse;
  } catch {}
  const message = body?.errors?.[0] ?? body?.error ?? `Request failed with status ${res.status}`;
  return new ApiError(message, res.status, body?.errors);
}

async function fetchJson<T>(
  path: string,
  init: RequestInit = {},
  { auth = true }: { auth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (auth) {
    const token = getToken();
    if (token) headers.set("authorization", `Bearer ${token}`);
  }
  const res = await fetch(path, { ...init, headers });
  if (auth && res.status === 401 && typeof window !== "undefined") {
    clearToken();
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  return fetchJson<Quote>("/api/quote", { method: "POST", body: JSON.stringify(input) });
}

export async function getQuoteById(id: string): Promise<Quote> {
  return fetchJson<Quote>(`/api/quote/${id}`);
}

export async function updateQuote(id: string, input: Partial<CreateQuoteInput>): Promise<Quote> {
  return fetchJson<Quote>(`/api/quote/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteQuote(id: string): Promise<void> {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  const res = await fetch(`/api/quote/${id}`, { method: "DELETE", headers });
  if (!res.ok && res.status !== 204) throw await parseError(res);
}

export async function issuePolicy(input: IssuePolicyInput): Promise<IssuePolicyResponse> {
  return fetchJson<IssuePolicyResponse>("/api/policy", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getPolicyById(id: string): Promise<Policy> {
  return fetchJson<Policy>(`/api/policy/${id}`);
}

export async function fetchCertificateBlob(policyNumber: string): Promise<Blob> {
  const token = getToken();
  const headers = new Headers();
  if (token) headers.set("authorization", `Bearer ${token}`);
  const res = await fetch(`/api/policy/certificate/${encodeURIComponent(policyNumber)}`, {
    headers,
  });
  if (!res.ok) throw await parseError(res);
  return res.blob();
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  return fetchJson<LoginResponse>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify(input) },
    { auth: false }
  );
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResponse> {
  return fetchJson<ForgotPasswordResponse>(
    "/api/auth/forgot-password",
    { method: "POST", body: JSON.stringify(input) },
    { auth: false }
  );
}

export interface UpdateProfileInput {
  fullName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export async function getCurrentUser(): Promise<import("@/lib/types").AuthUser> {
  return fetchJson("/api/auth/me");
}

export async function updateCurrentUser(
  input: UpdateProfileInput
): Promise<import("@/lib/types").AuthUser> {
  return fetchJson("/api/auth/me", { method: "PATCH", body: JSON.stringify(input) });
}

type StatusQuery = { status?: string; page?: number; limit?: number; quoteId?: string };

function buildQuery(q: StatusQuery): string {
  const params = new URLSearchParams();
  if (q.status) params.set("status", q.status);
  if (q.page != null) params.set("page", String(q.page));
  if (q.limit != null) params.set("limit", String(q.limit));
  if (q.quoteId) params.set("quoteId", q.quoteId);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function getMyQuotes(q: StatusQuery = {}): Promise<QuoteListResponse> {
  return fetchJson<QuoteListResponse>(`/api/quote/mine${buildQuery(q)}`);
}

export async function getMyPolicies(q: StatusQuery = {}): Promise<PolicyListResponse> {
  return fetchJson<PolicyListResponse>(`/api/policy/mine${buildQuery(q)}`);
}

export async function getAllPolicies(q: StatusQuery = {}): Promise<PolicyListResponse> {
  return fetchJson<PolicyListResponse>(`/api/policy${buildQuery(q)}`);
}

export async function getMyQuoteCounts(): Promise<import("@/lib/types").QuoteCounts> {
  return fetchJson("/api/quote/mine/counts");
}

export async function getMyPolicyCounts(): Promise<import("@/lib/types").PolicyCounts> {
  return fetchJson("/api/policy/mine/counts");
}

export async function getAllPolicyCounts(): Promise<import("@/lib/types").PolicyCounts> {
  return fetchJson("/api/policy/counts");
}

export async function getUserCounts(): Promise<import("@/lib/types").UserCounts> {
  return fetchJson("/api/user/counts");
}

export async function getMyQuoteTimeseries(
  days = 30
): Promise<import("@/lib/types").TimeseriesResponse> {
  return fetchJson(`/api/quote/mine/timeseries?days=${days}`);
}

export async function getMyPolicyTimeseries(
  days = 30
): Promise<import("@/lib/types").TimeseriesResponse> {
  return fetchJson(`/api/policy/mine/timeseries?days=${days}`);
}

export async function getPolicyForQuote(quoteId: string): Promise<Policy | null> {
  const res = await getMyPolicies({ quoteId, limit: 1 });
  return res.data[0] ?? null;
}

export async function approvePolicy(id: string): Promise<{ message: string; policy: Policy }> {
  return fetchJson(`/api/policy/approve/${id}`, { method: "PATCH" });
}

export async function rejectPolicy(id: string): Promise<{ message: string; policy: Policy }> {
  return fetchJson(`/api/policy/reject/${id}`, { method: "PATCH" });
}

export async function getWalletBalance(): Promise<WalletBalanceResponse> {
  return fetchJson<WalletBalanceResponse>("/api/wallet/balance");
}

export interface TopupInput {
  userId: string;
  amount: number;
  description?: string;
}

export interface TopupResponse {
  message: string;
  user: { id: string; fullName: string; role: string; wallet: number };
  transaction: { id: string; amount: number; type: "CREDIT" | "DEBIT"; description: string };
}

export async function topupWallet(input: TopupInput): Promise<TopupResponse> {
  return fetchJson<TopupResponse>("/api/wallet/topup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listUsers(
  params: { page?: number; limit?: number; role?: import("@/lib/types").UserRole } = {}
): Promise<import("@/lib/types").UserListResponse> {
  const search = new URLSearchParams();
  if (params.page != null) search.set("page", String(params.page));
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.role) search.set("role", params.role);
  const qs = search.toString();
  return fetchJson(`/api/user${qs ? `?${qs}` : ""}`);
}

export async function updateUserRole(
  id: string,
  role: import("@/lib/types").UserRole
): Promise<import("@/lib/types").UserListItem> {
  return fetchJson(`/api/user/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function createUser(
  input: import("@/lib/types").CreateUserInput
): Promise<import("@/lib/types").UserListItem> {
  return fetchJson("/api/user", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateUserRates(
  id: string,
  rates: import("@/lib/types").UpdateUserRatesInput
): Promise<import("@/lib/types").UserListItem> {
  return fetchJson(`/api/user/${id}/rates`, {
    method: "PATCH",
    body: JSON.stringify(rates),
  });
}

export type { Pagination, Policy, Quote };
