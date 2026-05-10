import express from "express";
import { createQuotes, getQuotes } from "../Controllers/quoteController.js";
import { authenticateToken } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { approveQuote } from "../Controllers/quoteController.js";
import { getpendingQuotes } from "../Controllers/quoteController.js";
import { rejectQuote } from "../Controllers/quoteController.js";

const router = express.Router();

router.post("/", createQuotes);
router.get("/", getQuotes);
router.patch("/approve/:id", authenticateToken, adminOnly, approveQuote);
router.get("/pending", authenticateToken, adminOnly, getpendingQuotes);
router.patch("/reject/:id", authenticateToken, adminOnly, rejectQuote);

export default router;
