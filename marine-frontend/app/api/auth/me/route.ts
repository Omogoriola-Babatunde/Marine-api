import { proxyToBackend } from "@/lib/proxy";

export async function GET(req: Request): Promise<Response> {
  return proxyToBackend(req, "/api/auth/me", "GET");
}

export async function PATCH(req: Request): Promise<Response> {
  return proxyToBackend(req, "/api/auth/me", "PATCH");
}
