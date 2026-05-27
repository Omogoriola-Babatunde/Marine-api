import { proxyToBackend } from "@/lib/proxy";

export async function GET(req: Request): Promise<Response> {
  return proxyToBackend(req, "/api/policy/mine/counts", "GET");
}
