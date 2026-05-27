import { env } from "@/lib/env";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const headers: Record<string, string> = {};
  const incomingAuth = req.headers.get("authorization");
  if (incomingAuth) headers.authorization = incomingAuth;

  const upstream = await fetch(`${env.API_URL}/api/policy/${encodeURIComponent(id)}`, {
    method: "GET",
    headers,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
