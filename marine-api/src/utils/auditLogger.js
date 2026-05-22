import { getPrismaClient } from "../config/db.js";

const prisma = getPrismaClient();

export const createAuditLog = async ({ userId, action, description }) => {
  if (!userId || !action) {
    console.warn("[auditLogger] skipping write: missing userId or action", { userId, action });
    return;
  }
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        description: description ?? "",
      },
    });
  } catch (error) {
    console.error("[auditLogger] failed to write audit log:", error);
  }
};
