import express from "express";
import { forgotPassword, loginUser, registerUser } from "../Controllers/authController.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);

export default router;
