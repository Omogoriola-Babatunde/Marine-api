import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_FETCH = global.fetch;

describe("GET /api/policy/certificate/:policyNumber (proxy)", () => {
  beforeEach(() => {
    process.env.API_URL = "http://api.test";
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  it("streams the PDF and preserves content-type and content-disposition", async () => {
    const fakePdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // "%PDF"
    global.fetch = vi.fn().mockResolvedValue(
      new Response(fakePdfBytes, {
        status: 200,
        headers: {
          "content-type": "application/pdf",
          "content-disposition": 'attachment; filename="certificate-POL-1.pdf"',
        },
      })
    );

    const { GET } = await import("@/app/api/policy/certificate/[policyNumber]/route");
    const res = await GET(new Request("http://localhost:3000/api/policy/certificate/POL-1"), {
      params: Promise.resolve({ policyNumber: "POL-1" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe(
      'attachment; filename="certificate-POL-1.pdf"'
    );

    const buf = new Uint8Array(await res.arrayBuffer());
    expect(buf).toEqual(fakePdfBytes);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/policy/certificate/POL-1"
    );
  });

  it("propagates 404 when backend can't find the cert", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("Not Found", { status: 404 }));
    const { GET } = await import("@/app/api/policy/certificate/[policyNumber]/route");
    const res = await GET(new Request("http://localhost:3000/api/policy/certificate/POL-9"), {
      params: Promise.resolve({ policyNumber: "POL-9" }),
    });
    expect(res.status).toBe(404);
  });
});
