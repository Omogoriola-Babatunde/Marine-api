import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPrismaClient } from "../config/db.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";
import { createAuditLog } from "../utils/auditLogger.js";

const prisma = getPrismaClient();

const sanitizeUser = (user) => {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isStrongPassword = (s) =>
  typeof s === "string" &&
  s.length >= 8 &&
  s.length <= 200 &&
  /[a-z]/.test(s) &&
  /[A-Z]/.test(s) &&
  /\d/.test(s) &&
  /[^A-Za-z0-9]/.test(s);

export const registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

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
        role: "USER",
      },
    });

    res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error("registerUser error:", error);
    res.status(500).json({ error: "Error creating user" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error("loginUser error:", error);
    res.status(500).json({ error: "Error logging in" });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(sanitizeUser(user));
  } catch (error) {
    console.error("getCurrentUser error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

export const updateCurrentUser = async (req, res) => {
  try {
    const { fullName, email, currentPassword, newPassword } = req.body;

    const existing = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!existing) {
      return res.status(404).json({ error: "User not found" });
    }

    const data = {};

    if (fullName !== undefined) {
      if (typeof fullName !== "string" || fullName.trim().length === 0 || fullName.length > 100) {
        return res.status(400).json({ error: "fullName must be 1-100 chars" });
      }
      data.fullName = fullName.trim();
    }

    if (email !== undefined && email !== existing.email) {
      if (typeof email !== "string" || email.length > 200 || !EMAIL_RE.test(email)) {
        return res.status(400).json({ error: "email must be a valid email (max 200 chars)" });
      }
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken && taken.id !== existing.id) {
        return res.status(409).json({ error: "Email already registered" });
      }
      data.email = email;
    }

    if (newPassword !== undefined) {
      if (!currentPassword || typeof currentPassword !== "string") {
        return res
          .status(400)
          .json({ error: "currentPassword is required to change password" });
      }
      const valid = await bcrypt.compare(currentPassword, existing.password);
      if (!valid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      if (!isStrongPassword(newPassword)) {
        return res.status(400).json({
          error:
            "newPassword must be 8-200 chars and include upper & lower case, a number, and a special character",
        });
      }
      data.password = await bcrypt.hash(newPassword, 12);
      data.mustChangePassword = false;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No changes provided" });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data,
    });

    await createAuditLog({
      userId: req.user.userId,
      action: "UPDATE_PROFILE",
      description: `Updated fields: ${Object.keys(data).join(", ")}`,
    });

    res.json(sanitizeUser(updated));
  } catch (error) {
    console.error("updateCurrentUser error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (email && typeof email === "string") {
      const user = await prisma.user.findFirst({ where: { email } });
      if (user) {
        console.log(`[forgotPassword] would send reset link to ${email}`);
      }
    }
    // Always return the same response — do not leak whether the email exists.
    res.json({ message: "If an account exists for that email, a reset link has been sent." });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.json({ message: "If an account exists for that email, a reset link has been sent." });
  }
};
