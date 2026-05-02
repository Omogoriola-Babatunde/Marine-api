import { env } from "@/lib/env";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ policyNumber: string }> }
): Promise<Response> {
  const { policyNumber } = await params;
  const upstream = await fetch(
    `${env.API_URL}/api/policy/certificate/${encodeURIComponent(policyNumber)}`
  );

  // Force inline disposition so the cert renders in <iframe> previews. The
  // download anchor sets `download="<filename>"` to control the saved name —
  // it does not need a backend Content-Disposition header for that.
  const headers = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  headers.set("content-disposition", "inline");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
