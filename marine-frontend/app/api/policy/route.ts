import { env } from "@/lib/env";

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const upstream = await fetch(`${env.API_URL}/api/policy`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
