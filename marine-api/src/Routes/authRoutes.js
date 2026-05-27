import express from "express";
import {
  forgotPassword,
  getCurrentUser,
  loginUser,
  registerUser,
  updateCurrentUser,
} from "../Controllers/authController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.get("/me", authenticateToken, getCurrentUser);
router.patch("/me", authenticateToken, updateCurrentUser);

export default router;
