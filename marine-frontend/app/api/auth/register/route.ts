import { proxyToBackend } from "@/lib/proxy";

export async function POST(req: Request): Promise<Response> {
  return proxyToBackend(req, "/api/auth/register", "POST");
}
