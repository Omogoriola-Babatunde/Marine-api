import express from "express";
import { exportProductionreport } from "../Controllers/reportControllers.js";
import { adminOnly, authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/production", authenticateToken, adminOnly, exportProductionreport);

export default router;
