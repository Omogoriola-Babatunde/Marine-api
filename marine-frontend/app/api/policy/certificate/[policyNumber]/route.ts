import { env } from "@/lib/env";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ policyNumber: string }> }
): Promise<Response> {
  const { policyNumber } = await params;
  const upstream = await fetch(
    `${env.API_URL}/api/policy/certificate/${encodeURIComponent(policyNumber)}`
  );

  const headers = new Headers();
  const ct = upstream.headers.get("content-type");
  const cd = upstream.headers.get("content-disposition");
  if (ct) headers.set("content-type", ct);
  if (cd) headers.set("content-disposition", cd);

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
