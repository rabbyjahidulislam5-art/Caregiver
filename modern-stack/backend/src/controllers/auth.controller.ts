import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role, phone, bloodGroup, firstName, lastName, experienceYears, profession, presentAddress, permanentAddress } = req.body;

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.' });
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User
    const user = await prisma.user.create({
      data: {
        username: email,
        email,
        passwordHash,
        role: role as any,
        phone: phone || '',
        bloodGroup: bloodGroup || '',
      }
    });

    // Create Profile
    await prisma.profile.create({
      data: {
        userId: user.id,
        firstName: firstName || '',
        lastName: lastName || '',
        profession: profession || null,
        experienceYears: experienceYears ? parseInt(String(experienceYears)) : null,
        presentAddress: presentAddress || null,
        permanentAddress: permanentAddress || null,
        isActive: true,
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: { action: 'USER_REGISTERED', userId: user.id, details: `New ${role} registered: ${email}` }
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

    // Audit log
    await prisma.auditLog.create({
      data: { action: 'USER_LOGIN', userId: user.id, details: `${user.role} logged in: ${email}` }
    });

    res.json({ userId: user.id, role: user.role, email: user.email, token, message: 'Login successful' });
  } catch (error: any) {
    res.status(500).json({ error: 'Login failed: ' + error.message });
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (userId) {
      await prisma.auditLog.create({
        data: { action: 'USER_LOGOUT', userId, details: 'User logged out' }
      });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

// GET /api/auth/profile/:userId
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId as string;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    res.json({
      fullName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),
      phone: user.phone,
      email: user.email,
      address: profile.presentAddress,
      profession: profile.profession,
      profilePictureUrl: profile.profilePictureUrl,
      image: profile.profilePictureUrl,
      role: user.role,
      experienceYears: profile.experienceYears,
      rating: profile.rating,
      isActive: profile.isActive,
      firstName: profile.firstName,
      lastName: profile.lastName,
      permanentAddress: profile.permanentAddress,
      bloodGroup: user.bloodGroup,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
};
