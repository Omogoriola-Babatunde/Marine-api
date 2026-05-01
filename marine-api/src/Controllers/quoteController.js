import { getPrismaClient } from "../config/db.js";
import { calculatePremium } from "../Services/quotesServices.js";
import { validateQuoteInput } from "../utils/validation.js";

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
      },
    });
    res.json(quote);
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
