import express from "express";
import {
  approveQuote,
  createQuotes,
  deleteQuote,
  getapprovedQuotes,
  getMyQuoteCounts,
  getMyQuotes,
  getpendingQuotes,
  getQuoteById,
  getQuotes,
  rejectQuote,
  updateQuote,
} from "../Controllers/quoteController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

router.post("/", authenticateToken, authorizeRoles("ADMIN", "STAFF", "USER"), createQuotes);
router.get("/", authenticateToken, authorizeRoles("ADMIN", "STAFF"), getQuotes);
router.get("/mine", authenticateToken, getMyQuotes);
router.get("/mine/counts", authenticateToken, getMyQuoteCounts);
router.get("/pending", authenticateToken, authorizeRoles("ADMIN"), getpendingQuotes);
router.get("/approved", authenticateToken, authorizeRoles("ADMIN", "STAFF"), getapprovedQuotes);
router.patch("/approve/:id", authenticateToken, authorizeRoles("ADMIN"), approveQuote);
router.patch("/reject/:id", authenticateToken, authorizeRoles("ADMIN"), rejectQuote);
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "STAFF", "USER"),
  getQuoteById
);
router.patch(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "STAFF", "USER"),
  updateQuote
);
router.delete("/:id", authenticateToken, authorizeRoles("ADMIN"), deleteQuote);

export default router;
