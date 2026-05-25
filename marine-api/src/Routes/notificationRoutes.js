import express from "express";
import { getNotifications, markNotificationasRead } from "../Controllers/notificationController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
router.get("/", authenticateToken, getNotifications);
router.patch("/:id/read", authenticateToken, markNotificationasRead);

export default router;