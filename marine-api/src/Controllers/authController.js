import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPrismaClient } from "../config/db.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";

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
