import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auditMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  // Intercept the response to ensure we only log on successful actions if needed,
  // but for an audit log, logging the attempt is usually standard.
  // We'll hook into 'finish' to log the final status code.
  res.on('finish', async () => {
    // Only log mutations or specific routes to prevent database bloat
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      try {
        const userId = req.user?.id || null;
        const action = `${req.method} ${req.originalUrl}`;
        const details = `Status: ${res.statusCode}. IP: ${req.ip}`;

        await prisma.auditLog.create({
          data: {
            action,
            userId,
            details,
          }
        });
      } catch (err) {
        console.error('Failed to write audit log', err);
      }
    }
  });

  next();
};
