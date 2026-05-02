import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_FETCH = global.fetch;

describe("POST /api/quote (proxy)", () => {
  beforeEach(() => {
    process.env.API_URL = "http://api.test";
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("forwards body to ${API_URL}/api/quote and returns 200 with backend body", async () => {
    const backendBody = { id: "q1", premium: 5, classType: "A" };
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(backendBody), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const { POST } = await import("@/app/api/quote/route");
    const req = new Request("http://localhost:3000/api/quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ classType: "A" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(backendBody);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/quote",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "content-type": "application/json" }),
        body: JSON.stringify({ classType: "A" }),
      })
    );
  });

  it("propagates 4xx body and status from backend", async () => {
    const errBody = { errors: ["classType must be A, B, or C"] };
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(errBody), { status: 400 })
    );

    const { POST } = await import("@/app/api/quote/route");
    const req = new Request("http://localhost:3000/api/quote", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual(errBody);
  });
});
