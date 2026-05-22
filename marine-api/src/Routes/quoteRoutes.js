import express from "express";
import {
  approveQuote,
  createQuotes,
  deleteQuote,
  getapprovedQuotes,
  getMyQuotes,
  getpendingQuotes,
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
router.get("/pending", authenticateToken, authorizeRoles("ADMIN"), getpendingQuotes);
router.get("/approved", authenticateToken, authorizeRoles("ADMIN", "STAFF"), getapprovedQuotes);
router.patch("/approve/:id", authenticateToken, authorizeRoles("ADMIN"), approveQuote);
router.patch("/reject/:id", authenticateToken, authorizeRoles("ADMIN"), rejectQuote);
router.patch(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "STAFF", "USER"),
  updateQuote
);
router.delete("/:id", authenticateToken, authorizeRoles("ADMIN"), deleteQuote);

export default router;
