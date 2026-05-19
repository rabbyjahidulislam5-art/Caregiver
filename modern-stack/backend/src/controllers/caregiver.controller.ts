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
      .filter((p: any) => p.profession && p.profession.trim() !== '')
      .map((p: any) => ({
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
      .filter((p: any) => p.profession && p.profession.trim() !== '')
      .map((p: any) => ({
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
      .map((p: any) => p.profession)
      .filter((p: any): p is string => p !== null && p.trim() !== '');

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
      profiles = profiles.filter((p: any) =>
        p.user.schedules.some((s: any) => s.dayOfWeek === String(day))
      );
    }

    const result = profiles.map((p: any) => ({
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
    const { firstName, lastName, profession, experienceYears, address, phone, profilePictureUrl,
            gender, dob, emergencyContact, nidNumber, nidFrontUrl, nidBackUrl, certificateUrl, policeClearanceUrl, kycStatus } = req.body;

    const profile = await prisma.profile.findUnique({ where: { userId } });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!profile || !user) return res.status(404).json({ error: 'Profile not found' });

    const changedFields: string[] = [];
    if (firstName !== undefined && firstName !== profile.firstName) changedFields.push('First Name');
    if (lastName !== undefined && lastName !== profile.lastName) changedFields.push('Last Name');
    if (profession !== undefined && profession !== profile.profession) changedFields.push('Profession Category');
    if (experienceYears !== undefined && experienceYears !== '' && parseInt(String(experienceYears)) !== profile.experienceYears) changedFields.push('Experience Years');
    if (address !== undefined && address !== profile.presentAddress) changedFields.push('Address');
    if (phone !== undefined && phone !== user.phone) changedFields.push('Phone Number');
    if (profilePictureUrl !== undefined && profilePictureUrl !== profile.profilePictureUrl) changedFields.push('Profile Picture');
    
    // KYC checks
    if (gender !== undefined && gender !== profile.gender) changedFields.push('Gender');
    if (dob !== undefined && dob !== profile.dob?.toISOString()) changedFields.push('Date of Birth');
    if (emergencyContact !== undefined && emergencyContact !== profile.emergencyContact) changedFields.push('Emergency Contact');
    if (nidNumber !== undefined && nidNumber !== profile.nidNumber) changedFields.push('NID Number');
    if (nidFrontUrl !== undefined && nidFrontUrl !== profile.nidFrontUrl) changedFields.push('NID Front');
    if (nidBackUrl !== undefined && nidBackUrl !== profile.nidBackUrl) changedFields.push('NID Back');
    if (certificateUrl !== undefined && certificateUrl !== profile.certificateUrl) changedFields.push('Certificate');
    if (policeClearanceUrl !== undefined && policeClearanceUrl !== profile.policeClearanceUrl) changedFields.push('Police Clearance');
    if (kycStatus !== undefined && kycStatus !== profile.kycStatus) changedFields.push('KYC Status');

    if (changedFields.length > 0) {
      await prisma.profile.update({
        where: { userId },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(profession !== undefined && { profession }),
          ...(experienceYears !== undefined && experienceYears !== '' && { experienceYears: parseInt(String(experienceYears)) }),
          ...(address !== undefined && { presentAddress: address }),
          ...(profilePictureUrl !== undefined && { profilePictureUrl }),
          ...(gender !== undefined && { gender }),
          ...(dob !== undefined && { dob: new Date(dob) }),
          ...(emergencyContact !== undefined && { emergencyContact }),
          ...(nidNumber !== undefined && { nidNumber }),
          ...(nidFrontUrl !== undefined && { nidFrontUrl }),
          ...(nidBackUrl !== undefined && { nidBackUrl }),
          ...(certificateUrl !== undefined && { certificateUrl }),
          ...(policeClearanceUrl !== undefined && { policeClearanceUrl }),
          ...(kycStatus !== undefined && { kycStatus }),
        }
      });

      if (phone !== undefined && phone !== user.phone) {
        await prisma.user.update({ where: { id: userId }, data: { phone } });
      }

      await prisma.auditLog.create({
        data: {
          action: 'PROFILE_UPDATED',
          userId: userId,
          details: `User ${user.email} updated their: ${changedFields.join(', ')}`
        }
      });
    }

    res.json({ message: 'Profile updated successfully!' });
  } catch (error: any) {
    res.status(500).json({ error: 'Update failed: ' + error.message });
  }
};
