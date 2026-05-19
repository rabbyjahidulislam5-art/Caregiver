import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/notifications
export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// PUT /api/notifications/:id/read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true }
    });
    res.json({ message: 'Marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};
