import express from "express";
import { getMyBalance, topupWallet } from "../Controllers/walletController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

router.get("/balance", authenticateToken, getMyBalance);
router.post("/topup", authenticateToken, authorizeRoles("ADMIN"), topupWallet);

export default router;
