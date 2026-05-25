import { getPrismaClient } from "../config/db";
import { createAuditLog } from "./auditLogger.js";

const prisma = getPrismaClient();   

export const fundWallet = async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Amount must be greater than zero" });
        }

        const wallet = await prisma.wallet.update({
            where: { userId: req.user.userId },
            data: { wallet: { increment: amount, }, 
        },
        });

        await prisma.walletTransaction.create({
            data: {
                userId: req.user.userId,
                 amount,
                type: "CREDIT",
                description: "Funds added to wallet",
            },
        });
        res.json({ message: "Wallet funded successfully", 
        wallet: user.wallet });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error funding wallet" });
    }
};

export const getWalletBalance = async (req, res) => {
    try {
        const wallet = await prisma.wallet.findUnique({
            where: { userId: req.user.userId },
        });
        res.json(wallet);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error fetching wallet balance" });
    }
};