import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { auditMiddleware } from './middlewares/audit.middleware';
import { authMiddleware } from './middlewares/auth.middleware';
import authRoutes from './routes/auth.routes';
import apiRoutes from './routes/api.routes';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const prisma = new PrismaClient();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(authMiddleware);
app.use(auditMiddleware);

// Routes — mount auth at /api and all other endpoints at /api
app.use('/api', authRoutes);
app.use('/api', apiRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'CaregiverGO API is running', version: '2.0.0' });
});

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Admin Seed — matches Java CaregiverApp.initAdmin()
async function seedAdmin() {
  try {
    const existing = await prisma.user.findUnique({ where: { email: 'admin@caregiver.com' } });
    if (!existing) {
      const hash = await bcrypt.hash('Admin@123', 12);
      const admin = await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@caregiver.com',
          passwordHash: hash,
          role: 'admin',
          phone: '0000000000',
        }
      });
      await prisma.profile.create({
        data: {
          userId: admin.id,
          firstName: 'System',
          lastName: 'Admin',
          isActive: true,
          profession: 'Administrator',
        }
      });
      console.log('>>> Admin User & Profile Created Successfully.');
    }
  } catch (e) {
    console.error('Admin seed error:', e);
  }
}

// Start Server
app.listen(PORT, async () => {
  await seedAdmin();
  console.log(`Server running on port ${PORT}`);
});
