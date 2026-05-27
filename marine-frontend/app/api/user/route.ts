import { proxyToBackend } from "@/lib/proxy";

export async function GET(req: Request): Promise<Response> {
  return proxyToBackend(req, "/api/user", "GET");
}

export async function POST(req: Request): Promise<Response> {
  return proxyToBackend(req, "/api/user", "POST");
}
