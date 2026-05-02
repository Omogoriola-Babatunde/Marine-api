import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_FETCH = global.fetch;

describe("POST /api/policy (proxy)", () => {
  beforeEach(() => {
    process.env.API_URL = "http://api.test";
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("forwards body and returns 200 with backend body", async () => {
    const backendBody = {
      policy: { id: "p1", policyNumber: "POL-1234567890" },
      certificatePath: "/foo.pdf",
    };
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(backendBody), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const { POST } = await import("@/app/api/policy/route");
    const req = new Request("http://localhost:3000/api/policy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quoteId: "abc", customername: "Acme" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(backendBody);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/policy",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("propagates 404 from backend (quote not found)", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Quote not found" }), { status: 404 })
    );

    const { POST } = await import("@/app/api/policy/route");
    const req = new Request("http://localhost:3000/api/policy", {
      method: "POST",
      body: JSON.stringify({ quoteId: "missing", customername: "X" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});
