import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getPrismaClient } from "../config/db.js";
import { CERTIFICATE_DIR } from "../config/paths.js";
import { generateCertificate } from "../Services/certificateService.js";
import { validatePolicyInput } from "../utils/validation.js";

const prisma = getPrismaClient();

const POLICY_NUMBER_RE = /^POL-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createPolicy = async (req, res) => {
  try {
    const { Quoteid, customername } = req.body;

    const validation = validatePolicyInput({ Quoteid, customername });
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const quote = await prisma.quote.findUnique({
      where: { id: Quoteid },
    });
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const policyNumber = `POL-${randomUUID()}`;
    const policy = await prisma.policy.create({
      data: {
        policyNumber,
        quoteId: Quoteid,
        customername,
        status: "active",
      },
    });
    const certificatePath = await generateCertificate(policy, quote);

    res.json({ policy, certificatePath });
  } catch (error) {
    console.error("createPolicy error:", error);
    res.status(500).json({ error: "Failed to create policy" });
  }
};

export const downloadCertificate = async (req, res) => {
  try {
    const { policyNumber } = req.params;

    if (!policyNumber || !POLICY_NUMBER_RE.test(policyNumber)) {
      return res.status(400).json({ error: "Invalid policy number format" });
    }

    const fileName = `certificate-${policyNumber}.pdf`;
    const filePath = path.join(CERTIFICATE_DIR, fileName);
    const normalizedPath = path.normalize(filePath);

    const rel = path.relative(CERTIFICATE_DIR, normalizedPath);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      return res.status(403).json({ error: "Access denied" });
    }

    try {
      await fs.access(normalizedPath);
    } catch {
      return res.status(404).json({ error: "Certificate not found" });
    }

    res.download(normalizedPath, fileName);
  } catch (error) {
    console.error("downloadCertificate error:", error);
    res.status(500).json({ error: "Failed to download certificate" });
  }
};
