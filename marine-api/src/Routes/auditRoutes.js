import express from 'express';
import { getPrismaClient } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/roles.js';

const prisma = getPrismaClient();
const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("ADMIN"), async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            include: {
                user: true,
            },
            orderBy: {
                createdAt: "desc",
            },            
        });
        res.json(logs);
    } catch (error) {
        console.error("getAuditLogs error:", error);
        res.status(500).json({ error: "Failed to fetch audit logs" });
    }
});     

export default router;
                    