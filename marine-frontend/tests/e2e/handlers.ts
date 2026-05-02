import { readFileSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { FIXTURE_POLICY, FIXTURE_QUOTE } from "./fixtures";

const certBytes = readFileSync(join(process.cwd(), "tests/e2e/cert-fixture.pdf"));

export const handlers = [
  http.post("http://api.mock/api/quote", async () => HttpResponse.json(FIXTURE_QUOTE)),
  http.post("http://api.mock/api/policy", async () =>
    HttpResponse.json({ policy: FIXTURE_POLICY, certificatePath: "/tmp/cert.pdf" })
  ),
  http.get("http://api.mock/api/policy/certificate/:policyNumber", async () => {
    return new HttpResponse(certBytes, {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="certificate-${FIXTURE_POLICY.policyNumber}.pdf"`,
      },
    });
  }),
];
