import { getToken } from "@/lib/auth";
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
  RegisterInput,
  RegisterResponse,
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
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  return fetchJson<Quote>("/api/quote", { method: "POST", body: JSON.stringify(input) });
}

export async function issuePolicy(input: IssuePolicyInput): Promise<IssuePolicyResponse> {
  return fetchJson<IssuePolicyResponse>("/api/policy", {
    method: "POST",
    body: JSON.stringify(input),
  });
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

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  return fetchJson<RegisterResponse>(
    "/api/auth/register",
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

type StatusQuery = { status?: string; page?: number; limit?: number };

function buildQuery(q: StatusQuery): string {
  const params = new URLSearchParams();
  if (q.status) params.set("status", q.status);
  if (q.page != null) params.set("page", String(q.page));
  if (q.limit != null) params.set("limit", String(q.limit));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function getMyQuotes(q: StatusQuery = {}): Promise<QuoteListResponse> {
  return fetchJson<QuoteListResponse>(`/api/quote/mine${buildQuery(q)}`);
}

export async function getMyPolicies(q: StatusQuery = {}): Promise<PolicyListResponse> {
  return fetchJson<PolicyListResponse>(`/api/policy/mine${buildQuery(q)}`);
}

export async function getWalletBalance(): Promise<WalletBalanceResponse> {
  return fetchJson<WalletBalanceResponse>("/api/wallet/balance");
}

export type { Pagination, Policy, Quote };
