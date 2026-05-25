import { getPrismaClient } from "../config/db";

const prisma = getPrismaClient();
export const getAdmindashboard = async (req, res) => {
    try {
        const [
            totalUsers,
            totalPolicies,
            totalQuotes,
            pendingPolicies,
            totalPremium,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.policy.count(),
            prisma.quote.count(),
            prisma.policy.count({ where: { status: "PENDING_APPROVAL" } }),
            prisma.quote.aggregate({ _sum: { premium: true } }),
        ]);
        res.json({
            totalUsers,
            totalPolicies,
            totalQuotes,
            pendingPolicies,
            totalPremium: totalPremium._sum.premium || 0,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
};

