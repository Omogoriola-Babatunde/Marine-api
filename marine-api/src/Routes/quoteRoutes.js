import express from "express";
import {
  approveQuote,
  createQuotes,
  getpendingQuotes,
  getQuotes,
  rejectQuote,
} from "../Controllers/quoteController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

router.post("/", authenticateToken, authorizeRoles("ADMIN", "STAFF", "USER"), createQuotes);
router.get("/", authenticateToken, authorizeRoles("ADMIN", "STAFF"), getQuotes);
router.get("/pending", authenticateToken, authorizeRoles("ADMIN"), getpendingQuotes);
router.patch("/approve/:id", authenticateToken, authorizeRoles("ADMIN"), approveQuote);
router.patch("/reject/:id", authenticateToken, authorizeRoles("ADMIN"), rejectQuote);

export default router;
