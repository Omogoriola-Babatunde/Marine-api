import { proxyToBackend } from "@/lib/proxy";

export async function GET(req: Request): Promise<Response> {
  return proxyToBackend(req, "/api/policy/counts", "GET");
}
