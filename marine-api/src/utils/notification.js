import { getPrismaClient } from "../config/db";

const prisma = getPrismaClient();

export const createNotification = async ({ userId, title, message }) => {
  return await prisma.notification.create({
    data: {
      userId,
      title,
      message
    }
  });
};