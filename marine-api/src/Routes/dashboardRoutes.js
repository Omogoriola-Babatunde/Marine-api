import express from "express";
import { getAdmindashboard } from "../Controllers/dashboardController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authorizeRoles } from "../middleware/roles.js";

const router = express.Router();

router.get("/admin", authenticateToken, authorizeRoles("ADMIN"), getAdmindashboard);

export default router;

// this sucks