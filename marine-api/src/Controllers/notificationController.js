import { getPrismaClient } from "../config/db";

const prisma = getPrismaClient();

export const getNotification = async (req, res) => {
    try {
        const notification = await prisma.notification.findMany({
            where: {
                userId: req.user.userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};
    export const markNotificationasRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await prisma.notification.update({
            where: { id,},
            data: {
                isRead: true,
            },
        });
        res.json(notification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }        
};