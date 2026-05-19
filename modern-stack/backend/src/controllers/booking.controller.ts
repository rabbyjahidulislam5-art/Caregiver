import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/notification.service';

const prisma = new PrismaClient();

// POST /api/book — Create Booking (status=pending)
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { clientId, caregiverId, serviceDate } = req.body;

    // Verify if caregiver profile is active (approved by admin)
    const targetCaregiverProfile = await prisma.profile.findUnique({ where: { userId: caregiverId } });
    if (!targetCaregiverProfile || !targetCaregiverProfile.isActive) {
      return res.status(403).json({ error: 'Caregiver profile is not approved or verified by administration.' });
    }

    const booking = await prisma.booking.create({
      data: {
        clientId,
        caregiverId,
        status: 'pending',
        serviceDate: new Date(serviceDate),
      }
    });

    const client = await prisma.user.findUnique({ where: { id: clientId } });
    const caregiver = await prisma.user.findUnique({ where: { id: caregiverId }, include: { profile: true } });
    const cgName = caregiver?.profile ? `${caregiver.profile.firstName} ${caregiver.profile.lastName}` : caregiver?.email || caregiverId;

    await prisma.auditLog.create({
      data: {
        action: 'BOOKING_CREATED',
        userId: clientId,
        details: `Client ${client?.email || clientId} created a pending booking request for Caregiver: ${cgName}`
      }
    });

    // Notify Caregiver
    await NotificationService.send(
      caregiverId,
      'New Booking Request',
      `You have received a new booking request from ${client?.email || 'a client'}. Please review and accept/reject it.`
    );

    res.status(201).json(booking);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create booking: ' + error.message });
  }
};

// GET /api/bookings/caregiver/:caregiverId/pending
export const getPendingBookings = async (req: Request, res: Response) => {
  try {
    const caregiverId = req.params.caregiverId as string;
    const bookings = await prisma.booking.findMany({
      where: { caregiverId, status: 'pending' },
      include: {
        client: { include: { profile: true } }
      }
    });

    const result = bookings.map((b: any) => ({
      bookingId: b.id,
      clientName: b.client.profile ? `${b.client.profile.firstName} ${b.client.profile.lastName}` : 'Unknown',
      clientPhone: b.client.phone || 'N/A',
      clientAddress: b.client.profile?.presentAddress || 'N/A',
      status: b.status,
      serviceDate: b.serviceDate,
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch pending bookings' });
  }
};

// POST /api/bookings/:bookingId/accept — status → CAREGIVER_ACCEPTED
export const acceptBooking = async (req: Request, res: Response) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: (req.params.bookingId as string) },
      data: { status: 'CAREGIVER_ACCEPTED' }
    });

    const caregiver = await prisma.user.findUnique({ where: { id: booking.caregiverId } });
    const client = await prisma.user.findUnique({ where: { id: booking.clientId }, include: { profile: true } });
    const clientName = client?.profile ? `${client.profile.firstName} ${client.profile.lastName}` : client?.email || booking.clientId;

    await prisma.auditLog.create({
      data: {
        action: 'BOOKING_ACCEPTED',
        userId: booking.caregiverId,
        details: `Caregiver ${caregiver?.email || booking.caregiverId} accepted booking request from Client: ${clientName}`
      }
    });

    // Notify Client
    await NotificationService.send(
      booking.clientId,
      'Booking Accepted by Caregiver',
      `Your booking request has been accepted by ${caregiver?.email || 'the caregiver'}. It is now awaiting Admin approval.`
    );

    res.json(booking);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to accept booking' });
  }
};

// POST /api/bookings/:bookingId/reject — status → rejected
export const rejectBooking = async (req: Request, res: Response) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: (req.params.bookingId as string) },
      data: { status: 'rejected' }
    });

    const caregiver = await prisma.user.findUnique({ where: { id: booking.caregiverId } });
    const client = await prisma.user.findUnique({ where: { id: booking.clientId }, include: { profile: true } });
    const clientName = client?.profile ? `${client.profile.firstName} ${client.profile.lastName}` : client?.email || booking.clientId;

    await prisma.auditLog.create({
      data: {
        action: 'BOOKING_REJECTED',
        userId: booking.caregiverId,
        details: `Caregiver ${caregiver?.email || booking.caregiverId} rejected booking request from Client: ${clientName}`
      }
    });

    // Notify Client
    await NotificationService.send(
      booking.clientId,
      'Booking Rejected',
      `Unfortunately, your booking request has been rejected by ${caregiver?.email || 'the caregiver'}.`
    );

    res.json(booking);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to reject booking' });
  }
};

// POST /api/bookings/:bookingId/complete — status → completed
export const completeBooking = async (req: Request, res: Response) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: (req.params.bookingId as string) },
      data: { status: 'completed' }
    });

    const caregiver = await prisma.user.findUnique({ where: { id: booking.caregiverId } });
    const client = await prisma.user.findUnique({ where: { id: booking.clientId }, include: { profile: true } });
    const clientName = client?.profile ? `${client.profile.firstName} ${client.profile.lastName} (${client.email})` : client?.email || booking.clientId;

    await prisma.auditLog.create({
      data: {
        action: 'BOOKING_COMPLETED',
        userId: booking.caregiverId,
        details: `Caregiver ${caregiver?.email || booking.caregiverId} completed booking with Client: ${clientName}`
      }
    });

    res.json(booking);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to complete booking' });
  }
};

// GET /api/bookings/caregiver/:caregiverId/history — APPROVED/ASSIGNED/COMPLETED
export const getCaregiverHistory = async (req: Request, res: Response) => {
  try {
    const caregiverId = String(req.params.caregiverId);
    const bookings = await prisma.booking.findMany({
      where: {
        caregiverId,
        status: { in: ['APPROVED_BY_ADMIN', 'completed'] }
      },
      include: { client: { include: { profile: true } } },
      orderBy: { serviceDate: 'desc' }
    });

    const result = bookings.map((b: any) => ({
      bookingId: b.id,
      caregiverId: b.caregiverId,
      caregiverName: 'Me',
      status: b.status,
      serviceDate: b.serviceDate,
      clientName: b.client.profile ? `${b.client.profile.firstName} ${b.client.profile.lastName}` : 'Unknown',
      clientPhone: b.client.phone || 'N/A',
      clientAddress: b.client.profile?.presentAddress || 'N/A',
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch caregiver history' });
  }
};

// GET /api/bookings/caregiver/:caregiverId/accepted
export const getCaregiverAccepted = async (req: Request, res: Response) => {
  try {
    const caregiverId = String(req.params.caregiverId);
    const bookings = await prisma.booking.findMany({
      where: {
        caregiverId,
        status: { in: ['CAREGIVER_ACCEPTED', 'APPROVED_BY_ADMIN'] }
      },
      include: { client: { include: { profile: true } } }
    });

    const result = bookings.map((b: any) => ({
      bookingId: b.id,
      caregiverId: b.caregiverId,
      caregiverName: 'Me',
      status: b.status,
      serviceDate: b.serviceDate,
      clientName: b.client.profile ? `${b.client.profile.firstName} ${b.client.profile.lastName}` : 'Unknown',
      clientPhone: b.client.phone || 'N/A',
      clientAddress: b.client.profile?.presentAddress || 'N/A',
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch accepted bookings' });
  }
};

// GET /api/bookings/active/:clientId — Client's APPROVED future bookings
export const getClientActiveBookings = async (req: Request, res: Response) => {
  try {
    const clientId = req.params.clientId as string;
    const now = new Date();
    now.setDate(now.getDate() - 1);

    const bookings = await prisma.booking.findMany({
      where: {
        clientId,
        status: 'APPROVED_BY_ADMIN',
        serviceDate: { gte: now }
      },
      include: { caregiver: { include: { profile: true } } }
    });

    const result = bookings.map((b: any) => ({
      bookingId: b.id,
      caregiverId: b.caregiverId,
      caregiverName: b.caregiver.profile ? `${b.caregiver.profile.firstName} ${b.caregiver.profile.lastName}` : 'Unknown',
      profession: b.caregiver.profile?.profession || 'N/A',
      status: b.status,
      serviceDate: b.serviceDate,
      address: b.caregiver.profile?.presentAddress || 'N/A',
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch active bookings' });
  }
};

// GET /api/bookings/history/:clientId — All client bookings
export const getClientHistory = async (req: Request, res: Response) => {
  try {
    const clientId = req.params.clientId as string;
    const bookings = await prisma.booking.findMany({
      where: { clientId },
      include: { caregiver: { include: { profile: true } } },
      orderBy: { serviceDate: 'desc' }
    });

    const result = bookings.map((b: any) => ({
      bookingId: b.id,
      caregiverId: b.caregiverId,
      caregiverName: b.caregiver.profile ? `${b.caregiver.profile.firstName} ${b.caregiver.profile.lastName}` : 'Unknown',
      profession: b.caregiver.profile?.profession || 'N/A',
      status: b.status,
      serviceDate: b.serviceDate,
      address: b.caregiver.profile?.presentAddress || 'N/A',
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch client history' });
  }
};
