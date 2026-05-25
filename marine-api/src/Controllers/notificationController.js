import { getPrismaClient } from "../config/db.js";
import { isUuid } from "../utils/validation.js";

const prisma = getPrismaClient();

export const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
  } catch (error) {
    console.error("getNotifications error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: "Invalid notification id" });
    }

    // Scope to the authenticated user — never let one user mark another's
    // notifications as read.
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(notification);
  } catch (error) {
    console.error("markNotificationAsRead error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};
