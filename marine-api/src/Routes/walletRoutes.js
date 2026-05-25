import express from "express";
import {authenticateToken} from "../middleware/auth.js";
import {authorizeRoles} from "../middleware/roles.js";
import {getWalletBalance, fundWallet} from "../Controllers/walletController.js";

const router = express.Router();

router.get("/balance", authenticateToken, authorizeRoles("USER"), getWalletBalance);
router.post("/fund", authenticateToken, authorizeRoles("ADMIN"), fundWallet);

export default router;