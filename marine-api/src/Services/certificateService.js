import path from "node:path";
import { CERTIFICATE_DIR } from "../config/paths.js";
import { getBrowserPool } from "../utils/browserPool.js";
import { escapeHtml } from "../utils/validation.js";

export const generateCertificate = async (policy, quote) => {
  const browser = await getBrowserPool();
  const page = await browser.newPage();
  try {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Certificate</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <h2 style="text-align: center;">Certificate of Insurance</h2>
    <h3 style="text-align: center;">Marine Cargo Insurance</h3>

    <p><strong>Policy Number:</strong> ${escapeHtml(policy.policyNumber)}</p>
    <p><strong>Customer Name:</strong> ${escapeHtml(policy.customername)}</p>
    <p><strong>Quote ID:</strong> ${escapeHtml(policy.quoteId)}</p>
    <hr>
    <h4>Policy Details:</h4>
    <p><strong>Cargo Type:</strong> ${escapeHtml(quote.cargoType)}</p>
    <p><strong>Origin:</strong> ${escapeHtml(quote.origin)}</p>
    <p><strong>Destination:</strong> ${escapeHtml(quote.destination)}</p>
    <hr>

    <h4>Coverage:</h4>
    <p>This certificate confirms that the above-mentioned cargo is insured under the terms and conditions of the Marine Cargo Insurance policy. The coverage includes protection against loss or damage to the cargo during transit.</p>
    <p><strong>Coverage Amount:</strong> $${quote.cargoValue.toFixed(2)}</p>
    <p><strong>Premium Paid:</strong> $${quote.premium.toFixed(2)}</p>
    <hr>
    <p><strong>Issue Date:</strong> ${new Date().toLocaleDateString()}</p>
</body>
</html>`;

    await page.setContent(htmlContent);
    const filePath = path.join(CERTIFICATE_DIR, `certificate-${policy.policyNumber}.pdf`);
    await page.pdf({ path: filePath, format: "A4" });
    return filePath;
  } finally {
    await page.close();
  }
};
