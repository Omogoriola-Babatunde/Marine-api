import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getPrismaClient } from "../config/db.js";
import { CERTIFICATE_DIR } from "../config/paths.js";
import { generateCertificate } from "../Services/certificateService.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { createNotification } from "../utils/notification.js";
import { isUuid, validatePolicyInput } from "../utils/validation.js";

const prisma = getPrismaClient();

const POLICY_NUMBER_RE = /^POL-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createPolicy = async (req, res) => {
  try {
    const { quoteId, customerName } = req.body;

    const validation = validatePolicyInput({ quoteId, customerName });
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const quote = await prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }
    if (quote.status !== "GENERATED") {
      return res.status(400).json({ error: `Quote is ${quote.status} and cannot be converted` });
    }

    const policyNumber = `POL-${randomUUID()}`;
    const policy = await prisma.$transaction(async (tx) => {
      const created = await tx.policy.create({
        data: {
          policyNumber,
          quoteId,
          customerName,
          status: "PENDING_APPROVAL",
          issuedById: req.user.userId,
        },
      });
      await tx.quote.update({
        where: { id: quoteId },
        data: { status: "CONVERTED" },
      });
      return created;
    });

    await createAuditLog({
      userId: req.user.userId,
      action: "CREATE_POLICY",
      description: `Issued policy ${policy.policyNumber} from quote ${quoteId}`,
    });

    res.status(201).json({ message: "Policy submitted for approval", policy });
  } catch (error) {
    console.error("createPolicy error:", error);
    res.status(500).json({ error: "Failed to create policy" });
  }
};

export const approvePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: "Invalid policy id" });
    }

    const policy = await prisma.policy.findUnique({
      where: { id },
      include: { quote: true, issuedBy: true },
    });
    if (!policy) {
      return res.status(404).json({ error: "Policy not found" });
    }
    if (policy.status !== "PENDING_APPROVAL") {
      return res.status(400).json({ error: "Policy already processed" });
    }
    if (policy.issuedBy.wallet < policy.quote.premium) {
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    const updatedPolicy = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: policy.issuedById },
        data: { wallet: { decrement: policy.quote.premium } },
      });
      await tx.walletTransaction.create({
        data: {
          userId: policy.issuedById,
          amount: policy.quote.premium,
          type: "DEBIT",
          description: `Debit for policy ${policy.policyNumber}`,
        },
      });
      return tx.policy.update({
        where: { id },
        data: { status: "APPROVED" },
      });
    });

    let certificatePath = null;
    try {
      certificatePath = await generateCertificate(updatedPolicy, policy.quote);
    } catch (err) {
      console.error("approvePolicy: certificate generation failed:", err);
    }

    await createNotification({
      userId: policy.issuedById,
      title: "Policy Approved",
      message: `Policy ${policy.policyNumber} has been approved.`,
    });
    await createAuditLog({
      userId: req.user.userId,
      action: "APPROVE_POLICY",
      description: `Approved policy ${updatedPolicy.policyNumber}`,
    });

    res.json({ message: "Policy approved", policy: updatedPolicy, certificatePath });
  } catch (error) {
    console.error("approvePolicy error:", error);
    res.status(500).json({ error: "Failed to approve policy" });
  }
};

export const rejectPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: "Invalid policy id" });
    }

    const existing = await prisma.policy.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Policy not found" });
    }
    if (existing.status !== "PENDING_APPROVAL") {
      return res.status(400).json({ error: "Policy already processed" });
    }

    const policy = await prisma.policy.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    await createAuditLog({
      userId: req.user.userId,
      action: "REJECT_POLICY",
      description: `Rejected policy ${policy.policyNumber}`,
    });

    res.json({ message: "Policy rejected", policy });
  } catch (error) {
    console.error("rejectPolicy error:", error);
    res.status(500).json({ error: "Failed to reject policy" });
  }
};

export const getpendingPolicies = async (_req, res) => {
  try {
    const policies = await prisma.policy.findMany({
      where: { status: "PENDING_APPROVAL" },
      include: {
        quote: true,
        issuedBy: {
          select: { id: true, username: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(policies);
  } catch (error) {
    console.error("getpendingPolicies error:", error);
    res.status(500).json({ error: "Failed to fetch pending policies" });
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
