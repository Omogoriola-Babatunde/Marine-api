import express from "express";
import { createQuotes, getQuotes } from "../Controllers/quoteController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

router.post("/",authenticateToken,authorizeRoles("ADMIN", "STAFF", "USER"), createQuotes);
router.get("/",authenticateToken,authorizeRoles("ADMIN", "STAFF", "USER"), getQuotes);

export default router;
