import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '../services/notification.service';

const prisma = new PrismaClient();

// GET /api/admin/users — All users with profile names
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({ include: { profile: true } });
    const result = users.map((u: any) => ({
      userId: u.id,
      email: u.email,
      role: u.role,
      firstName: u.profile?.firstName || 'N/A',
      lastName: u.profile?.lastName || '',
      profession: u.profile?.profession || null,
      phone: u.phone || null,
      createdAt: u.createdAt,
      bloodGroup: u.bloodGroup || null,
      profilePictureUrl: u.profile?.profilePictureUrl || null,
      presentAddress: u.profile?.presentAddress || null,
      permanentAddress: u.profile?.permanentAddress || null,
      gender: u.profile?.gender || null,
      dob: u.profile?.dob || null,
      nidNumber: u.profile?.nidNumber || null,
      nidFrontUrl: u.profile?.nidFrontUrl || null,
      nidBackUrl: u.profile?.nidBackUrl || null,
      certificateUrl: u.profile?.certificateUrl || null,
      policeClearanceUrl: u.profile?.policeClearanceUrl || null,
      kycStatus: u.profile?.kycStatus || 'PENDING',
    }));
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Fetch user email for the audit log before they are gone
    const targetUser = await prisma.user.findUnique({ where: { id }, include: { profile: true } });
    const userIdentifier = targetUser?.email || id;
    const roleName = targetUser?.role || 'user';
    const fullName = targetUser?.profile ? `${targetUser.profile.firstName} ${targetUser.profile.lastName}` : 'Unknown Name';

    // Manually delete all dependent records to avoid foreign key constraints
    await prisma.profile.deleteMany({ where: { userId: id } });
    await prisma.booking.deleteMany({ where: { OR: [{ clientId: id }, { caregiverId: id }] } });
    await prisma.review.deleteMany({ where: { OR: [{ clientId: id }, { caregiverId: id }] } });
    await prisma.complaint.deleteMany({ where: { OR: [{ clientId: id }, { caregiverId: id }] } });
    await prisma.schedule.deleteMany({ where: { caregiverId: id } });

    // Finally delete the user. Audit logs will have their userId set to NULL automatically by Prisma (onDelete: SetNull)
    await prisma.user.delete({ where: { id } });

    // Create a NEW audit log for this deletion action (tied to the Admin)
    await prisma.auditLog.create({
      data: { 
        action: 'USER_DELETED', 
        userId: req.user?.id, 
        details: `Admin deleted ${roleName} ${fullName} (${userIdentifier}) (ID: ${id})` 
      }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete user: ' + error.message });
  }
};

// GET /api/admin/pending-caregivers
export const getPendingCaregivers = async (req: Request, res: Response) => {
  try {
    const profiles = await prisma.profile.findMany({
      where: { isActive: false, user: { role: 'caregiver' } },
      include: { user: true }
    });

    const result = profiles.map((p: any) => ({
      profileId: p.id,
      userId: p.userId,
      firstName: p.firstName,
      lastName: p.lastName,
      email: p.user.email,
      profession: p.profession,
      experienceYears: p.experienceYears,
      kycStatus: p.kycStatus,
      nidNumber: p.nidNumber,
      nidFrontUrl: p.nidFrontUrl,
      nidBackUrl: p.nidBackUrl,
      certificateUrl: p.certificateUrl,
      policeClearanceUrl: p.policeClearanceUrl,
      gender: p.gender,
      dob: p.dob,
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch pending caregivers' });
  }
};

// PUT /api/admin/approve/:profileId
export const approveCaregiver = async (req: Request, res: Response) => {
  try {
    const profileId = req.params.profileId as string;
    const profile = await prisma.profile.update({ 
      where: { id: profileId }, 
      data: { isActive: true, kycStatus: 'APPROVED' },
      include: { user: true }
    });

    const fullName = `${profile.firstName} ${profile.lastName}`;

    // 1. Log for Admin
    await prisma.auditLog.create({
      data: { action: 'CAREGIVER_APPROVED', userId: req.user?.id, details: `Approved caregiver profile for ${fullName} (${profile.user.email})` }
    });

    // 2. Log for Caregiver
    await prisma.auditLog.create({
      data: { action: 'PROFILE_APPROVED', userId: profile.userId, details: `Your professional profile has been officially approved by the Administration` }
    });

    // Send Notification
    await NotificationService.send(
      profile.userId,
      'Profile Approved',
      'Your professional profile has been officially approved. You can now accept booking requests!'
    );

    res.json({ message: 'Caregiver approved' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to approve caregiver' });
  }
};

// PUT /api/admin/reject/:profileId
export const rejectCaregiver = async (req: Request, res: Response) => {
  try {
    const profileId = req.params.profileId as string;
    const profile = await prisma.profile.update({ 
      where: { id: profileId }, 
      data: { kycStatus: 'REJECTED' },
      include: { user: true }
    });

    const fullName = `${profile.firstName} ${profile.lastName}`;

    await prisma.auditLog.create({
      data: { action: 'CAREGIVER_REJECTED', userId: req.user?.id, details: `Rejected caregiver profile for ${fullName} (${profile.user.email})` }
    });

    await prisma.auditLog.create({
      data: { action: 'PROFILE_REJECTED', userId: profile.userId, details: `Your professional profile was rejected.` }
    });

    await NotificationService.send(
      profile.userId,
      'Profile Rejected',
      'There was an issue with your profile verification documents. Please update them and resubmit.'
    );

    res.json({ message: 'Caregiver rejected' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to reject caregiver' });
  }
};

// GET /api/admin/requests/pending — Bookings pending admin review
export const getPendingBookingRequests = async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { status: { in: ['CAREGIVER_ACCEPTED', 'pending'] } },
      include: {
        client: { include: { profile: true } },
        caregiver: { include: { profile: true } },
      }
    });

    const result = bookings.map((b: any) => ({
      bookingId: b.id,
      status: b.status,
      serviceDate: b.serviceDate,
      clientName: b.client.profile ? `${b.client.profile.firstName} ${b.client.profile.lastName}` : `ID: ${b.clientId}`,
      caregiverName: b.caregiver.profile ? `${b.caregiver.profile.firstName} ${b.caregiver.profile.lastName}` : `ID: ${b.caregiverId}`,
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
};

// POST /api/admin/requests/:id/:action (approve/reject)
export const reviewBookingRequest = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const action = String(req.params.action);
    let newStatus: any;

    if (action === 'approve') newStatus = 'APPROVED_BY_ADMIN';
    else if (action === 'reject') newStatus = 'REJECTED_BY_ADMIN';
    else return res.status(400).json({ error: 'Invalid action' });

    const booking = await prisma.booking.update({ 
      where: { id }, 
      data: { status: newStatus },
      include: { 
        client: { include: { profile: true } }, 
        caregiver: { include: { profile: true } } 
      } 
    });

    const clientEmail = booking.client.email;
    const caregiverEmail = booking.caregiver.email;
    const clientName = booking.client.profile ? `${booking.client.profile.firstName} ${booking.client.profile.lastName} (${clientEmail})` : clientEmail;
    const caregiverName = booking.caregiver.profile ? `${booking.caregiver.profile.firstName} ${booking.caregiver.profile.lastName} (${caregiverEmail})` : caregiverEmail;

    // 1. Log for the Admin (The Performer)
    await prisma.auditLog.create({
      data: { 
        action: `BOOKING_${action.toUpperCase()}`, 
        userId: req.user?.id, 
        details: `Admin ${action}d booking ${id} (Assigned Caregiver: ${caregiverName} to Client: ${clientName})` 
      }
    });

    // 2. Log for the Client
    await prisma.auditLog.create({
      data: { action: `BOOKING_${newStatus}`, userId: booking.clientId, details: `Admin ${action}d your booking with ${caregiverName}` }
    });

    // 3. Log for the Caregiver
    await prisma.auditLog.create({
      data: { action: `BOOKING_${newStatus}`, userId: booking.caregiverId, details: `Admin ${action}d your booking with ${clientName}` }
    });

    // Send Notifications
    await NotificationService.send(
      booking.clientId,
      `Booking ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      `Your booking with ${caregiverName} has been ${action}d by the Administration.`
    );
    await NotificationService.send(
      booking.caregiverId,
      `Booking ${action === 'approve' ? 'Approved' : 'Rejected'}`,
      `Your booking with ${clientName} has been ${action}d by the Administration.`
    );

    res.json({ message: `Booking ${action}d` });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to review booking' });
  }
};

// GET /api/admin/complaints — All complaints enriched
export const getAllComplaints = async (req: Request, res: Response) => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: {
        client: { include: { profile: true } },
        caregiver: { include: { profile: true } },
      }
    });

    const result = complaints.map((c: any) => ({
      id: c.id,
      description: c.description,
      status: c.status,
      date: c.date,
      adminReply: c.adminReply,
      clientName: c.client.profile ? `${c.client.profile.firstName} ${c.client.profile.lastName}` : `ID: ${c.clientId}`,
      clientEmail: c.client.email,
      clientPhone: c.client.phone || 'N/A',
      caregiverName: c.caregiver.profile ? `${c.caregiver.profile.firstName} ${c.caregiver.profile.lastName}` : `ID: ${c.caregiverId}`,
      caregiverEmail: c.caregiver.email,
      caregiverPhone: c.caregiver.phone || 'N/A',
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

// PUT /api/admin/complaints/:id/reply
export const replyToComplaint = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { reply } = req.body;

    await prisma.complaint.update({
      where: { id },
      data: { adminReply: reply, status: 'REVIEWED' }
    });

    await prisma.auditLog.create({
      data: { action: 'COMPLAINT_REPLIED', userId: req.user?.id, details: `Replied to complaint ${id}` }
    });

    // We need the complaint to get the client ID to notify them
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (complaint) {
      await NotificationService.send(
        complaint.clientId,
        'Update on your Complaint',
        'Admin has replied to your complaint. Please check the dashboard.'
      );
    }

    res.json({ message: 'Reply sent' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to reply to complaint' });
  }
};

// GET /api/admin/audit-logs
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { email: true, role: true } } },
      orderBy: { timestamp: 'desc' },
      take: 200,
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// GET /api/admin/stats
export const getStats = async (req: Request, res: Response) => {
  try {
    const [totalUsers, totalBookings, totalComplaints, totalCaregivers] = await Promise.all([
      prisma.user.count(),
      prisma.booking.count(),
      prisma.complaint.count(),
      prisma.user.count({ where: { role: 'caregiver' } }),
    ]);
    res.json({ totalUsers, totalBookings, totalComplaints, totalCaregivers });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// DELETE /api/account/delete/:userId — Self-service account deletion
export const deleteSelf = async (req: Request, res: Response) => {
  try {
    const id = req.params.userId as string;
    const targetUser = await prisma.user.findUnique({ where: { id }, include: { profile: true } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const userEmail = targetUser.email;
    const userRole = targetUser.role;
    const fullName = targetUser.profile ? `${targetUser.profile.firstName} ${targetUser.profile.lastName}` : 'Unknown Name';

    // Write deletion audit log FIRST (before cascade, so userId is still valid)
    await prisma.auditLog.create({
      data: {
        action: 'USER_DELETED',
        userId: id,
        details: `${userRole} ${fullName} (${userEmail}) voluntarily deleted their own account (ID: ${id})`,
      }
    });

    // Cascade delete dependent records
    await prisma.profile.deleteMany({ where: { userId: id } });
    await prisma.booking.deleteMany({ where: { OR: [{ clientId: id }, { caregiverId: id }] } });
    await prisma.review.deleteMany({ where: { OR: [{ clientId: id }, { caregiverId: id }] } });
    await prisma.complaint.deleteMany({ where: { OR: [{ clientId: id }, { caregiverId: id }] } });
    await prisma.schedule.deleteMany({ where: { caregiverId: id } });

    // Delete user (AuditLog.userId will be set to NULL automatically via onDelete:SetNull)
    await prisma.user.delete({ where: { id } });

    res.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    console.error('Self-delete error:', error);
    res.status(500).json({ error: 'Failed to delete account: ' + error.message });
  }
};
