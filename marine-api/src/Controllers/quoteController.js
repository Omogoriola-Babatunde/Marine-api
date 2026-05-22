import { getPrismaClient } from "../config/db.js";
import { calculatePremium } from "../Services/quotesServices.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { sendMail } from "../utils/mailer.js";
import { isUuid, validateQuoteInput } from "../utils/validation.js";

const prisma = getPrismaClient();

export const createQuotes = async (req, res) => {
  try {
    const { classType, cargoType, cargoValue, origin, destination } = req.body;

    const validation = validateQuoteInput({
      classType,
      cargoType,
      cargoValue,
      origin,
      destination,
    });
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const premium = calculatePremium(classType, cargoValue);
    const quote = await prisma.quote.create({
      data: {
        classType,
        cargoType,
        cargoValue,
        origin,
        destination,
        premium,
        status: "GENERATED",
        createdById: req.user.userId,
      },
    });

    await createAuditLog({
      userId: req.user.userId,
      action: "CREATE_QUOTE",
      description: `Created quote ${quote.id}`,
    });

    if (process.env.ADMIN_NOTIFY_EMAIL) {
      sendMail({
        to: process.env.ADMIN_NOTIFY_EMAIL,
        subject: "New Quote Request",
        text:
          `A new quote has been created.\n\n` +
          `Cargo Type: ${cargoType}\n` +
          `Premium: ${premium}\n` +
          `Please review and approve or reject the quote in the admin panel.`,
      }).catch((err) => console.error("[createQuotes] sendMail failed:", err));
    }

    res.status(201).json(quote);
  } catch (error) {
    console.error("createQuotes error:", error);
    res.status(500).json({ error: "Failed to create quote" });
  }
};

export const getQuotes = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const status = req.query.status;
    const allowed = ["GENERATED", "CONVERTED", "EXPIRED"];
    if (status !== undefined && !allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${allowed.join(", ")}` });
    }
    const where = status ? { status } : {};

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.quote.count({ where }),
    ]);

    res.json({
      data: quotes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("getQuotes error:", error);
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
};

export const approveQuote = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: "Invalid quote id" });
    }

    const quote = await prisma.quote.findUnique({ where: { id } });
    if (!quote) {
      return res.status(404).json({ error: "Quote not found" });
    }
    if (quote.status !== "GENERATED") {
      return res.status(400).json({ error: `Quote is ${quote.status} and cannot be approved` });
    }

    await createAuditLog({
      userId: req.user.userId,
      action: "APPROVE_QUOTE",
      description: `Approved quote ${quote.id}`,
    });

    res.json(quote);
  } catch (error) {
    console.error("approveQuote error:", error);
    res.status(500).json({ error: "Failed to approve quote" });
  }
};

export const getpendingQuotes = async (_req, res) => {
  try {
    const pendingQuotes = await prisma.quote.findMany({
      where: { status: "GENERATED" },
      orderBy: { createdAt: "desc" },
    });
    res.json(pendingQuotes);
  } catch (error) {
    console.error("getpendingQuotes error:", error);
    res.status(500).json({ error: "Failed to fetch pending quotes" });
  }
};

export const getMyQuotes = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const status = req.query.status;
    const allowed = ["GENERATED", "CONVERTED", "EXPIRED"];
    if (status !== undefined && !allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${allowed.join(", ")}` });
    }

    const where = { createdById: req.user.userId, ...(status ? { status } : {}) };

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      prisma.quote.count({ where }),
    ]);

    res.json({
      data: quotes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("getMyQuotes error:", error);
    res.status(500).json({ error: "Failed to fetch your quotes" });
  }
};

export const getapprovedQuotes = async (_req, res) => {
  try {
    const approvedQuotes = await prisma.quote.findMany({
      where: { status: "CONVERTED" },
      orderBy: { createdAt: "desc" },
    });
    res.json(approvedQuotes);
  } catch (error) {
    console.error("getapprovedQuotes error:", error);
    res.status(500).json({ error: "Failed to fetch approved quotes" });
  }
};

export const updateQuote = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: "Invalid quote id" });
    }

    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Quote not found" });
    }
    if (existing.status !== "GENERATED") {
      return res
        .status(409)
        .json({ error: `Quote is ${existing.status} and cannot be edited` });
    }

    const isPrivileged = req.user.role === "ADMIN" || req.user.role === "STAFF";
    const isCreator = existing.createdById === req.user.userId;
    if (!isPrivileged && !isCreator) {
      return res.status(403).json({ error: "Not allowed to edit this quote" });
    }

    const merged = {
      classType: req.body.classType ?? existing.classType,
      cargoType: req.body.cargoType ?? existing.cargoType,
      cargoValue:
        req.body.cargoValue !== undefined ? req.body.cargoValue : existing.cargoValue,
      origin: req.body.origin ?? existing.origin,
      destination: req.body.destination ?? existing.destination,
    };

    const validation = validateQuoteInput(merged);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const premium = calculatePremium(merged.classType, merged.cargoValue);

    const updated = await prisma.quote.update({
      where: { id },
      data: { ...merged, premium },
    });

    await createAuditLog({
      userId: req.user.userId,
      action: "UPDATE_QUOTE",
      description: `Updated quote ${id}`,
    });

    res.json(updated);
  } catch (error) {
    console.error("updateQuote error:", error);
    res.status(500).json({ error: "Failed to update quote" });
  }
};

export const deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: "Invalid quote id" });
    }

    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Quote not found" });
    }
    if (existing.status !== "GENERATED") {
      return res
        .status(409)
        .json({ error: `Quote is ${existing.status} and cannot be deleted` });
    }

    await prisma.quote.delete({ where: { id } });

    await createAuditLog({
      userId: req.user.userId,
      action: "DELETE_QUOTE",
      description: `Deleted quote ${id}`,
    });

    res.status(204).end();
  } catch (error) {
    console.error("deleteQuote error:", error);
    res.status(500).json({ error: "Failed to delete quote" });
  }
};

export const rejectQuote = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: "Invalid quote id" });
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: { status: "EXPIRED" },
    });

    await createAuditLog({
      userId: req.user.userId,
      action: "REJECT_QUOTE",
      description: `Rejected quote ${quote.id}`,
    });

    res.json(quote);
  } catch (error) {
    console.error("rejectQuote error:", error);
    res.status(500).json({ error: "Failed to reject quote" });
  }
};
