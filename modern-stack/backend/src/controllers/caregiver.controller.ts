import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/caregivers — List all active caregivers with schedules
export const getCaregivers = async (req: Request, res: Response) => {
  try {
    const profiles = await prisma.profile.findMany({
      where: {
        user: { role: 'caregiver' },
        profession: { not: null },
        isActive: true,
      },
      include: { user: { include: { schedules: true } } }
    });

    const result = profiles
      .filter(p => p.profession && p.profession.trim() !== '')
      .map(p => ({
        profileId: p.id,
        userId: p.userId,
        firstName: p.firstName,
        lastName: p.lastName,
        profilePictureUrl: p.profilePictureUrl,
        presentAddress: p.presentAddress,
        permanentAddress: p.permanentAddress,
        profession: p.profession,
        experienceYears: p.experienceYears,
        rating: p.rating,
        isActive: p.isActive,
        schedules: p.user.schedules,
      }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch caregivers' });
  }
};

// GET /api/caregivers/search?profession=X
export const searchCaregivers = async (req: Request, res: Response) => {
  try {
    const profession = req.query.profession as string | undefined;

    const where: any = {
      user: { role: 'caregiver' },
      isActive: true,
    };

    if (profession && profession.trim()) {
      where.profession = { contains: profession, mode: 'insensitive' };
    }

    const profiles = await prisma.profile.findMany({
      where,
      include: { user: { include: { schedules: true } } }
    });

    const result = profiles
      .filter(p => p.profession && p.profession.trim() !== '')
      .map(p => ({
        profileId: p.id,
        userId: p.userId,
        firstName: p.firstName,
        lastName: p.lastName,
        profilePictureUrl: p.profilePictureUrl,
        presentAddress: p.presentAddress,
        profession: p.profession,
        experienceYears: p.experienceYears,
        rating: p.rating,
        isActive: p.isActive,
        schedules: p.user.schedules,
      }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to search caregivers' });
  }
};

// GET /api/caregivers/professions — Distinct professions list
export const getDistinctProfessions = async (req: Request, res: Response) => {
  try {
    const profiles = await prisma.profile.findMany({
      where: {
        user: { role: 'caregiver' },
        profession: { not: null },
      },
      select: { profession: true },
      distinct: ['profession'],
    });

    const professions = profiles
      .map(p => p.profession)
      .filter((p): p is string => p !== null && p.trim() !== '');

    res.json(professions);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch professions' });
  }
};

// GET /api/caregivers/filter?profession&minExp&minRating&day
export const filterCaregivers = async (req: Request, res: Response) => {
  try {
    const { profession, minExp, minRating, day } = req.query;

    const where: any = {
      user: { role: 'caregiver' },
      isActive: true,
    };

    if (profession && String(profession).trim()) {
      where.profession = String(profession);
    }
    if (minExp) {
      where.experienceYears = { gte: parseInt(String(minExp)) };
    }
    if (minRating) {
      where.rating = { gte: parseFloat(String(minRating)) };
    }

    let profiles = await prisma.profile.findMany({
      where,
      include: { user: { include: { schedules: true } } }
    });

    // Filter by day of week if specified
    if (day && String(day).trim()) {
      profiles = profiles.filter(p =>
        p.user.schedules.some(s => s.dayOfWeek === String(day))
      );
    }

    const result = profiles.map(p => ({
      profileId: p.id,
      userId: p.userId,
      firstName: p.firstName,
      lastName: p.lastName,
      profilePictureUrl: p.profilePictureUrl,
      presentAddress: p.presentAddress,
      profession: p.profession,
      experienceYears: p.experienceYears,
      rating: p.rating,
      isActive: p.isActive,
      schedules: p.user.schedules,
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to filter caregivers' });
  }
};

// PUT /api/update-profile/:userId
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const { firstName, lastName, profession, experienceYears, address, phone } = req.body;

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    await prisma.profile.update({
      where: { userId },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(profession !== undefined && { profession }),
        ...(experienceYears !== undefined && experienceYears !== '' && { experienceYears: parseInt(String(experienceYears)) }),
        ...(address !== undefined && { presentAddress: address }),
      }
    });

    if (phone !== undefined) {
      await prisma.user.update({ where: { id: userId }, data: { phone } });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.auditLog.create({
      data: {
        action: 'PROFILE_UPDATED',
        userId: userId,
        details: `User ${user?.email || userId} updated their profile information`
      }
    });

    res.json({ message: 'Profile updated successfully!' });
  } catch (error: any) {
    res.status(500).json({ error: 'Update failed: ' + error.message });
  }
};
