import { getPrismaClient } from "../config/db.js";
import { calculatePremium } from "../Services/quotesServices.js";
import { validateQuoteInput } from "../utils/validation.js";
import { transporter } from "../utils/mailer.js";
import { createAuditLog } from "../utils/auditLogger.js";

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
        status: "PENDING",
        createdById: req.user.userId,
      },
    });
    await createAuditLog({
      userId: req.user.userId,
      action: "CREATE_QUOTE",
      details: ` Created a new quote with ID: ${quote.id}`,
    });
    res.json(quote);
  } catch (error) {
    console.error("createQuotes error:", error);
    res.status(500).json({ error: "Failed to create quote" });
  }
};

await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: "admincompany@gmail.com",
  subject: "New Quote Request",
  text: `A new quote has been created with the following details:\n\n
  Cargo Type: ${cargoType}
  Premium: ${premium}
  Please review and approve or reject the quote in the admin panel.`,
});

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
    const quote = await prisma.quote.update({ 
      where: { id: parseInt(id) },
      data:{
        status: "APPROVED",
      },
    });
    await createAuditLog({
      userId: req.user.userId,
      action: "APPROVE_QUOTE",
      details: ` Approved quote with ID: ${quote.id}`,
    });
    res.json(quote);
      } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to approve quote" });
  }
    };

    export const getpendingQuotes = async (req, res) => {
      try {
        const pendingQuotes = await prisma.quote.findMany({
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
        });
        res.json(quotes);
      } catch (error) {
        console.error("getpendingQuotes error:", error);
        res.status(500).json({ error: "Failed to fetch pending quotes" });      
      }
    };

    export const rejectQuote = async (req, res) => {
      try {
        const { id } = req.params;
        const quote = await prisma.quote.update({
          where: { id: parseInt(id) },
          data: {
            status: "REJECTED",
          },
        });
        res.json(quote);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to reject quote" });
      }
    };
