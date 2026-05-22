import { env } from "@/lib/env";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  const headers: Record<string, string> = {
    "content-type": req.headers.get("content-type") ?? "application/json",
  };
  const incomingAuth = req.headers.get("authorization");
  if (incomingAuth) headers.authorization = incomingAuth;

  const body = await req.text();
  const upstream = await fetch(
    `${env.API_URL}/api/user/${encodeURIComponent(id)}/role`,
    { method: "PATCH", headers, body }
  );

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
