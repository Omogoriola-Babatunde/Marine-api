import path from "node:path";
import { CERTIFICATE_DIR } from "../config/paths.js";
import { getBrowserPool } from "../utils/browserPool.js";
import { renderHtml } from "./certificate-templates/corporate.js";

export const generateCertificate = async (policy, quote) => {
  const browser = await getBrowserPool();
  const page = await browser.newPage();
  try {
    await page.setContent(renderHtml(policy, quote), { waitUntil: "networkidle0" });
    const filePath = path.join(CERTIFICATE_DIR, `certificate-${policy.policyNumber}.pdf`);
    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return filePath;
  } finally {
    await page.close();
  }
};
