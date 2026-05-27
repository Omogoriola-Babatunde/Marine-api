import { getPrismaClient } from "../config/db.js";

const prisma = getPrismaClient();

export const createNotification = async ({
  userId,
  title,
  message,
  linkType = null,
  linkId = null,
}) => {
  try {
    return await prisma.notification.create({
      data: { userId, title, message, linkType, linkId },
    });
  } catch (err) {
    // Notifications are best-effort — never break the surrounding business flow
    // (e.g. policy approval) if the insert fails.
    console.error("createNotification failed:", err);
    return null;
  }
};
