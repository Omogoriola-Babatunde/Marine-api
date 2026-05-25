import bcrypt from "bcrypt";
import { getPrismaClient } from "../config/db.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { isUuid } from "../utils/validation.js";

const prisma = getPrismaClient();

const ALLOWED_ROLES = ["ADMIN", "STAFF", "USER"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isRateDecimal = (v) => Number.isFinite(v) && v >= 0 && v <= 1;

const isStrongPassword = (s) =>
  typeof s === "string" &&
  s.length >= 8 &&
  s.length <= 200 &&
  /[a-z]/.test(s) &&
  /[A-Z]/.test(s) &&
  /\d/.test(s) &&
  /[^A-Za-z0-9]/.test(s);

const sanitizeUser = (user) => {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
};

export const createUser = async (req, res) => {
  try {
    const { fullName, email, password, role, classARate, classBRate } = req.body;

    if (!fullName || typeof fullName !== "string" || fullName.length > 100) {
      return res.status(400).json({ error: "fullName is required (max 100 chars)" });
    }
    if (!email || typeof email !== "string" || email.length > 200 || !EMAIL_RE.test(email)) {
      return res
        .status(400)
        .json({ error: "email is required and must be a valid email (max 200 chars)" });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error:
          "password must be 8-200 chars and include upper & lower case, a number, and a special character",
      });
    }
    const finalRole = role ?? "USER";
    if (!ALLOWED_ROLES.includes(finalRole)) {
      return res.status(400).json({ error: `role must be one of ${ALLOWED_ROLES.join(", ")}` });
    }
    if (!isRateDecimal(classARate)) {
      return res
        .status(400)
        .json({ error: "classARate is required and must be a decimal between 0 and 1" });
    }
    if (!isRateDecimal(classBRate)) {
      return res
        .status(400)
        .json({ error: "classBRate is required and must be a decimal between 0 and 1" });
    }

    const emailTaken = await prisma.user.findUnique({ where: { email } });
    if (emailTaken) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        role: finalRole,
        classARate,
        classBRate,
        mustChangePassword: true,
      },
    });

    await createAuditLog({
      userId: req.user.userId,
      action: "CREATE_USER",
      description: `Created user ${user.id} (${user.email}) with role ${finalRole}, rates A=${classARate}, B=${classBRate}`,
    });

    res.status(201).json(sanitizeUser(user));
  } catch (error) {
    console.error("createUser error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};

export const updateUserRates = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const { classARate, classBRate } = req.body;
    if (!isRateDecimal(classARate)) {
      return res
        .status(400)
        .json({ error: "classARate is required and must be a decimal between 0 and 1" });
    }
    if (!isRateDecimal(classBRate)) {
      return res
        .status(400)
        .json({ error: "classBRate is required and must be a decimal between 0 and 1" });
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { classARate: true, classBRate: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { classARate, classBRate },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        classARate: true,
        classBRate: true,
      },
    });

    await createAuditLog({
      userId: req.user.userId,
      action: "UPDATE_USER_RATES",
      description: `Changed rates of user ${id}: A ${existing.classARate}→${classARate}, B ${existing.classBRate}→${classBRate}`,
    });

    res.json(updated);
  } catch (error) {
    console.error("updateUserRates error:", error);
    res.status(500).json({ error: "Failed to update user rates" });
  }
};

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
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          classARate: true,
          classBRate: true,
        },
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
