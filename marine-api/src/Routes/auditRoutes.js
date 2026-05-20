import express from "express";
import { getPrismaClient } from "../config/db.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const prisma = getPrismaClient();
const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("ADMIN"), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, parseInt(req.query.limit, 10) || 50);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, username: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count(),
    ]);

    res.json({
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getAuditLogs error:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

export default router;
