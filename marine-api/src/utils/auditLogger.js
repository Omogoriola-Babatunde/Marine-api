import { getPrismaClient } from "../config/db.js";
const prisma = getPrismaClient();

export const createAuditLog = async ({userId, action, details}) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                details
            }
        });
    } catch (error) {
        console.error(error);
    }
};