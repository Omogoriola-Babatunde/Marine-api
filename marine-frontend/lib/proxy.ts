import { env } from "@/lib/env";

export async function proxyToBackend(
  req: Request,
  upstreamPath: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET"
): Promise<Response> {
  const headers: Record<string, string> = {};
  const incomingAuth = req.headers.get("authorization");
  if (incomingAuth) headers["authorization"] = incomingAuth;

  const init: RequestInit = { method, headers };
  if (method !== "GET" && method !== "DELETE") {
    headers["content-type"] = req.headers.get("content-type") ?? "application/json";
    init.body = await req.text();
  }

  const url = new URL(req.url);
  const upstream = await fetch(`${env.API_URL}${upstreamPath}${url.search}`, init);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}
