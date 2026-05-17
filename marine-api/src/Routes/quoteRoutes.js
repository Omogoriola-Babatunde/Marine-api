import express from "express";
import { createQuotes, getQuotes } from "../Controllers/quoteController.js";
import { authenticateToken } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { approveQuote } from "../Controllers/quoteController.js";
import { getpendingQuotes } from "../Controllers/quoteController.js";
import { rejectQuote } from "../Controllers/quoteController.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

router.post("/",authenticateToken,authorizeRoles("ADMIN", "STAFF", "USER"), createQuotes);
router.get("/", getQuotes);
router.patch("/approve/:id", authenticateToken, authorizeRoles("ADMIN"), approveQuote);
router.get("/pending", authenticateToken, authorizeRoles("ADMIN"), getpendingQuotes);
router.patch("/reject/:id", authenticateToken, authorizeRoles("ADMIN"), rejectQuote);

export default router;
