
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { getPrismaClient } from "../config/db.js";
import { CERTIFICATE_DIR } from "../config/paths.js";
import { generateCertificate } from "../Services/certificateService.js";
import { validatePolicyInput } from "../utils/validation.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { createNotification } from "../utils/notification.js";

const prisma = getPrismaClient();

       

const POLICY_NUMBER_RE = /^POL-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const createPolicy = async (req, res) => {
  try {
    const { quoteId, customerName } = req.body;

    const validation = validatePolicyInput({ quoteId, customerName });
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
    });
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }

    const policyNumber = `POL-${randomUUID()}`;
    const policy = await prisma.policy.create({
      data: {
        policyNumber,
        quoteId,
        customerName,
        status: "PENDING_APPROVAL",
        issuedById: req.user.userId,
      },
    });

    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: "CONVERTED" },
    });

    await createAuditLog({
      userId: req.user.userId,
      action: "CREATE_POLICY",
      description: `Issued policy: ${policy.policyNumber} from quote ${quoteId}`,
    });
    res.json({message: "Policy submitted for approval", policy,});
  } catch (error) {
    console.error("createPolicy error:", error);
    res.status(500).json({ error: "Failed to create policy" });
  }
};
   
export const approvePolicy = async (req, res) => {  
  try {
    const { id } = req.params;
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
    //debit the issuer's wallet
    await prisma.user.update({
      where: { 
        id:policy.issuedById, 
      },
      data: { 
        wallet: {
          decrement: policy.quote.premium,
        },
       },
    });
     
    await prisma.walletTransaction.create({
      data: {
        userId: policy.issuedById,
        amount: policy.quote.premium,
        type: "DEBIT",
        description: `Debit for policy ${policy.policyNumber}`,
      },
    });

      //approve the policy
    const updatedPolicy = await prisma.policy.update({
      where: { id },
      data: { status: "APPROVED" }
    });
//generate certificate 
    const certificatePath = await generateCertificate(updatedPolicy, policy.quote);

    await createNotification({
      userId: policy.issuedById,
      title: "Policy Approved",
      message: `Policy ${policy.policyNumber} has been approved.`,
    });
// audit log
    await createAuditLog({
      userId: req.user.userId,
      action: "APPROVE_POLICY",
      description: `Approved policy: ${updatedPolicy.policyNumber}`,
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
    const policy = await prisma.policy.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    res.json({ message: "Policy rejected", policy });
  } catch (error) {
    console.error("rejectPolicy error:", error);
    res.status(500).json({ error: "Failed to reject policy" });
  }
};

export const getpendingPolicies = async (req, res) => {
  try {
    const policies = await prisma.policy.findMany({
      where: { status: "PENDING_APPROVAL" },
      include: { quote: true, issuedBy: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(policies);
  } catch (error) {
    console.error("getpendingPolicies error:", error);
    res.status(500).json({ error: "Failed to fetch pending policies" });
  }
};