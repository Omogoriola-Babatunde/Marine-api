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

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || typeof username !== "string" || username.length > 50) {
      return res.status(400).json({ error: "username is required (max 50 chars)" });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "password is required (min 8 chars)" });
    }
    if (email && (typeof email !== "string" || email.length > 200)) {
      return res.status(400).json({ error: "email must be a string (max 200 chars)" });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
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
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { username } });
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
