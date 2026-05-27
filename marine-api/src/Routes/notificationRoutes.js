import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
} from "../Controllers/notificationController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, getNotifications);
router.patch("/:id/read", authenticateToken, markNotificationAsRead);

export default router;
