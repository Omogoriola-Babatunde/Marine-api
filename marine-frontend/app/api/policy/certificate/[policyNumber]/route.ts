import { env } from "@/lib/env";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ policyNumber: string }> }
): Promise<Response> {
  const { policyNumber } = await params;
  const incomingAuth = req.headers.get("authorization");
  const headers: Record<string, string> = {};
  if (incomingAuth) headers["authorization"] = incomingAuth;

  const upstream = await fetch(
    `${env.API_URL}/api/policy/certificate/${encodeURIComponent(policyNumber)}`,
    { headers }
  );

  const out = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) out.set("content-type", ct);
  out.set("content-disposition", "inline");

  return new Response(upstream.body, { status: upstream.status, headers: out });
}
