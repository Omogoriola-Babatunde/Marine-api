import { getPrismaClient } from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { isUuid } from "../utils/validation.js";

const prisma = getPrismaClient();

const ALLOWED_ROLES = ["ADMIN", "STAFF", "USER"];

export const listUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    const role = req.query.role;
    if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
      return res
        .status(400)
        .json({ error: `role must be one of ${ALLOWED_ROLES.join(", ")}` });
    }

    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, fullName: true, email: true, role: true },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("listUsers error:", error);
    res.status(500).json({ error: "Failed to list users" });
  }
};

export const getUserCounts = async (_req, res) => {
  try {
    const grouped = await prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    });
    const out = { ALL: 0, ADMIN: 0, STAFF: 0, USER: 0 };
    for (const g of grouped) {
      out[g.role] = g._count._all;
      out.ALL += g._count._all;
    }
    res.json(out);
  } catch (error) {
    console.error("getUserCounts error:", error);
    res.status(500).json({ error: "Failed to fetch user counts" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const { role } = req.body;
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res
        .status(400)
        .json({ error: `role must be one of ${ALLOWED_ROLES.join(", ")}` });
    }

    if (id === req.user.userId) {
      return res.status(400).json({ error: "You cannot change your own role" });
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, fullName: true, email: true, role: true },
    });

    await createAuditLog({
      userId: req.user.userId,
      action: "UPDATE_USER_ROLE",
      description: `Changed role of user ${id} from ${existing.role} to ${role}`,
    });

    res.json(updated);
  } catch (error) {
    console.error("updateUserRole error:", error);
    res.status(500).json({ error: "Failed to update user role" });
  }
};
