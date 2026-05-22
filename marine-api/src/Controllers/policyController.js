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

export const getPolicies = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const status = req.query.status;
    const allowed = ["PENDING_APPROVAL", "APPROVED", "REJECTED"];
    if (status !== undefined && !allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${allowed.join(", ")}` });
    }
    const where = status ? { status } : {};

    const [policies, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        skip,
        take: limit,
        include: {
          quote: true,
          issuedBy: { select: { id: true, username: true, email: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.policy.count({ where }),
    ]);

    res.json({
      data: policies,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("getPolicies error:", error);
    res.status(500).json({ error: "Failed to fetch policies" });
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

export const getMyPolicies = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const status = req.query.status;
    const allowed = ["PENDING_APPROVAL", "APPROVED", "REJECTED"];
    if (status !== undefined && !allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${allowed.join(", ")}` });
    }

    const where = { issuedById: req.user.userId, ...(status ? { status } : {}) };

    const [policies, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        skip,
        take: limit,
        include: { quote: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.policy.count({ where }),
    ]);

    res.json({
      data: policies,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("getMyPolicies error:", error);
    res.status(500).json({ error: "Failed to fetch your policies" });
  }
};

export const getapprovedPolicies = async (_req, res) => {
  try {
    const policies = await prisma.policy.findMany({
      where: { status: "APPROVED" },
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
    console.error("getapprovedPolicies error:", error);
    res.status(500).json({ error: "Failed to fetch approved policies" });
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

    let exists = true;
    try {
      await fs.access(normalizedPath);
    } catch {
      exists = false;
    }

    if (!exists) {
      const policy = await prisma.policy.findUnique({
        where: { policyNumber },
        include: { quote: true },
      });
      if (!policy) {
        return res.status(404).json({ error: "Policy not found" });
      }
      if (policy.status !== "APPROVED") {
        return res.status(400).json({
          error: `Certificate is only available for APPROVED policies (current status: ${policy.status})`,
        });
      }
      await generateCertificate(policy, policy.quote);
    }

    res.download(normalizedPath, fileName);
  } catch (error) {
    console.error("downloadCertificate error:", error);
    res.status(500).json({ error: "Failed to download certificate", detail: error.message });
  }
};
