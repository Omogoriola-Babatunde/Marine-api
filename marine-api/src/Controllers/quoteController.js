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

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.quote.count(),
    ]);

    res.json({
      data: quotes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
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
