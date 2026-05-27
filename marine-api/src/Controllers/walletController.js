import { getPrismaClient } from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { createNotification } from "../utils/notification.js";
import { isUuid } from "../utils/validation.js";

const prisma = getPrismaClient();

const NAIRA = "₦";
const nairaFmt = new Intl.NumberFormat("en-NG", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const ngn = (n) => `${NAIRA}${nairaFmt.format(Math.abs(Number(n) || 0))}`;

export const topupWallet = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;

    if (!isUuid(userId)) {
      return res.status(400).json({ error: "userId must be a valid uuid" });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "amount must be a positive finite number" });
    }
    if (description !== undefined && (typeof description !== "string" || description.length > 200)) {
      return res.status(400).json({ error: "description must be a string (max 200 chars)" });
    }

    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { wallet: { increment: amount } },
        select: { id: true, fullName: true, wallet: true, role: true },
      });
      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          amount,
          type: "CREDIT",
          description: description || `Top-up by admin ${req.user.userId}`,
        },
      });
      return { user: updated, transaction };
    });

    await createAuditLog({
      userId: req.user.userId,
      action: "TOPUP_WALLET",
      description: `Credited ${amount} to user ${userId} (new balance ${result.user.wallet})`,
    });

    // Notify the recipient and the admin who funded. Best-effort — createNotification
    // already swallows its own errors so the top-up response isn't blocked.
    await Promise.all([
      createNotification({
        userId,
        title: "Wallet funded",
        message: `Your wallet was credited with ${ngn(amount)}. New balance: ${ngn(result.user.wallet)}.`,
      }),
      createNotification({
        userId: req.user.userId,
        title: "Top-up successful",
        message: `Credited ${ngn(amount)} to ${target.fullName}.`,
      }),
    ]);

    res.status(200).json({ message: "Wallet topped up", ...result });
  } catch (error) {
    console.error("topupWallet error:", error);
    res.status(500).json({ error: "Failed to top up wallet" });
  }
};

export const getMyBalance = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, fullName: true, wallet: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("getMyBalance error:", error);
    res.status(500).json({ error: "Failed to fetch wallet balance" });
  }
};
