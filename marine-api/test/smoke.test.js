import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

process.env.JWT_SECRET ||= "smoke-test-secret-do-not-use-in-prod";
process.env.NODE_ENV ||= "test";

const { default: jwt } = await import("jsonwebtoken");
const { default: app } = await import("../src/app.js");

let server;
let baseUrl;

const signToken = (claims) =>
  jwt.sign(claims, process.env.JWT_SECRET, { expiresIn: "1h" });

const json = async (path, init = {}) => {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  let body = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: res.status, body };
};

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("smoke: app boots and basic routing", () => {
  it("GET / returns 200", async () => {
    const { status } = await json("/");
    assert.equal(status, 200);
  });

  it("GET /api/nope returns 404 JSON", async () => {
    const { status, body } = await json("/api/nope");
    assert.equal(status, 404);
    assert.equal(body.error, "Not found");
  });

  it("invalid JSON body returns 400", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    assert.equal(res.status, 400);
  });

  it("oversized body returns 413", async () => {
    const big = "x".repeat(20_000);
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username: big, password: big }),
    });
    assert.equal(res.status, 413);
  });

  it("disabled x-powered-by header", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.headers.get("x-powered-by"), null);
  });

  it("serves helmet security headers", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.ok(res.headers.get("x-content-type-options"));
    assert.ok(res.headers.get("x-dns-prefetch-control"));
  });
});

describe("smoke: authentication", () => {
  it("POST /api/auth/login with empty body returns 400", async () => {
    const { status, body } = await json("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({}),
    });
    assert.equal(status, 400);
    assert.match(body.error, /username and password/i);
  });

  it("POST /api/auth/register with short password returns 400", async () => {
    const { status, body } = await json("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: "alice", password: "short" }),
    });
    assert.equal(status, 400);
    assert.match(body.error, /password/i);
  });

  it("POST /api/auth/forgot-password always returns the same generic message", async () => {
    const a = await json("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "nobody@example.com" }),
    });
    const b = await json("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({}),
    });
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.equal(a.body.message, b.body.message);
  });
});

describe("smoke: protected routes reject unauthenticated callers", () => {
  const protectedRoutes = [
    { method: "GET", path: "/api/quote" },
    { method: "POST", path: "/api/quote" },
    { method: "GET", path: "/api/quote/pending" },
    { method: "PATCH", path: "/api/quote/approve/x" },
    { method: "PATCH", path: "/api/quote/reject/x" },
    { method: "POST", path: "/api/policy" },
    { method: "GET", path: "/api/policy/pending" },
    { method: "PATCH", path: "/api/policy/approve/x" },
    { method: "PATCH", path: "/api/policy/reject/x" },
    { method: "GET", path: "/api/policy/certificate/POL-x" },
    { method: "GET", path: "/api/reports/production" },
    { method: "GET", path: "/api/audit" },
  ];

  for (const { method, path } of protectedRoutes) {
    it(`${method} ${path} → 401 without token`, async () => {
      const res = await fetch(`${baseUrl}${path}`, { method });
      assert.equal(res.status, 401);
    });
  }

  it("rejects malformed Authorization header", async () => {
    const res = await fetch(`${baseUrl}/api/audit`, {
      headers: { authorization: "not-a-bearer-token" },
    });
    assert.equal(res.status, 401);
  });

  it("rejects an invalid JWT", async () => {
    const res = await fetch(`${baseUrl}/api/audit`, {
      headers: { authorization: "Bearer not.a.real.jwt" },
    });
    assert.equal(res.status, 401);
  });

  it("rejects a JWT signed with the wrong secret", async () => {
    const bad = jwt.sign({ userId: "u", role: "ADMIN" }, "different-secret");
    const res = await fetch(`${baseUrl}/api/audit`, {
      headers: { authorization: `Bearer ${bad}` },
    });
    assert.equal(res.status, 401);
  });
});

describe("smoke: role enforcement", () => {
  it("STAFF token is forbidden from /api/audit (403)", async () => {
    const token = signToken({ userId: "u1", role: "STAFF" });
    const res = await fetch(`${baseUrl}/api/audit`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 403);
  });

  it("USER token is forbidden from /api/quote/pending (403)", async () => {
    const token = signToken({ userId: "u1", role: "USER" });
    const res = await fetch(`${baseUrl}/api/quote/pending`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 403);
  });

  it("USER token is forbidden from /api/reports/production (403)", async () => {
    const token = signToken({ userId: "u1", role: "USER" });
    const res = await fetch(`${baseUrl}/api/reports/production`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(res.status, 403);
  });
});

describe("smoke: input validation short-circuits before DB", () => {
  const admin = () => signToken({ userId: "u1", role: "ADMIN" });

  it("PATCH /api/policy/approve/:id rejects non-UUID id", async () => {
    const { status, body } = await json("/api/policy/approve/not-a-uuid", {
      method: "PATCH",
      headers: { authorization: `Bearer ${admin()}` },
    });
    assert.equal(status, 400);
    assert.match(body.error, /invalid/i);
  });

  it("PATCH /api/quote/reject/:id rejects non-UUID id", async () => {
    const { status, body } = await json("/api/quote/reject/not-a-uuid", {
      method: "PATCH",
      headers: { authorization: `Bearer ${admin()}` },
    });
    assert.equal(status, 400);
    assert.match(body.error, /invalid/i);
  });

  it("GET /api/policy/certificate rejects malformed policyNumber", async () => {
    const { status, body } = await json("/api/policy/certificate/not-valid", {
      headers: { authorization: `Bearer ${admin()}` },
    });
    assert.equal(status, 400);
    assert.match(body.error, /invalid policy number/i);
  });

  it("GET /api/reports/production rejects missing dates", async () => {
    const { status, body } = await json("/api/reports/production", {
      headers: { authorization: `Bearer ${admin()}` },
    });
    assert.equal(status, 400);
    assert.match(body.error, /startDate and endDate/i);
  });

  it("GET /api/reports/production rejects start after end", async () => {
    const { status } = await json(
      "/api/reports/production?startDate=2026-12-31&endDate=2026-01-01",
      { headers: { authorization: `Bearer ${admin()}` } }
    );
    assert.equal(status, 400);
  });
});

describe("smoke: OpenAPI docs", () => {
  it("GET /api/docs.json returns the spec", async () => {
    const { status, body } = await json("/api/docs.json");
    assert.equal(status, 200);
    assert.ok(body.openapi || body.swagger);
  });
});
