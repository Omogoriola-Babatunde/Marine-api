import type {
  ApiErrorResponse,
  CreateQuoteInput,
  ForgotPasswordInput,
  ForgotPasswordResponse,
  IssuePolicyInput,
  IssuePolicyResponse,
  LoginInput,
  LoginResponse,
  Quote,
  RegisterInput,
  RegisterResponse,
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
  } catch {
    // non-JSON body
  }
  const message = body?.errors?.[0] ?? body?.error ?? `Request failed with status ${res.status}`;
  return new ApiError(message, res.status, body?.errors);
}

export async function createQuote(input: CreateQuoteInput): Promise<Quote> {
  const res = await fetch("/api/quote", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as Quote;
}

export async function issuePolicy(input: IssuePolicyInput): Promise<IssuePolicyResponse> {
  const res = await fetch("/api/policy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as IssuePolicyResponse;
}

export async function fetchCertificateBlob(policyNumber: string): Promise<Blob> {
  const res = await fetch(`/api/policy/certificate/${encodeURIComponent(policyNumber)}`);
  if (!res.ok) throw await parseError(res);
  return res.blob();
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as LoginResponse;
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as RegisterResponse;
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<ForgotPasswordResponse> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as ForgotPasswordResponse;
}
