import { env } from "@/lib/env";

async function forward(
  req: Request,
  id: string,
  method: "GET" | "PATCH" | "DELETE"
): Promise<Response> {
  const headers: Record<string, string> = {};
  const incomingAuth = req.headers.get("authorization");
  if (incomingAuth) headers.authorization = incomingAuth;

  const init: RequestInit = { method, headers };
  if (method === "PATCH") {
    headers["content-type"] = req.headers.get("content-type") ?? "application/json";
    init.body = await req.text();
  }

  const upstream = await fetch(`${env.API_URL}/api/quote/${encodeURIComponent(id)}`, init);

  if (upstream.status === 204) {
    return new Response(null, { status: 204 });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  return forward(req, id, "GET");
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  return forward(req, id, "PATCH");
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
  return forward(req, id, "DELETE");
}
