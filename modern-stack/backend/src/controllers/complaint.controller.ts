import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/complaints/submit
export const submitComplaint = async (req: Request, res: Response) => {
  try {
    const clientId = String(req.body.clientId);
    const caregiverId = String(req.body.caregiverId);
    const description = String(req.body.description);

    if (!clientId || clientId === 'null' || clientId === 'undefined') {
      return res.status(400).json({ error: 'Client ID is missing' });
    }
    if (!caregiverId || caregiverId === 'null' || caregiverId === 'undefined') {
      return res.status(400).json({ error: 'Caregiver ID is missing' });
    }

    await prisma.complaint.create({
      data: { clientId, caregiverId, description, status: 'PENDING' }
    });

    res.json({ message: 'Complaint submitted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error: ' + error.message });
  }
};

// GET /api/complaints/all
export const getAllComplaints = async (req: Request, res: Response) => {
  try {
    const complaints = await prisma.complaint.findMany({
      include: {
        client: { include: { profile: true } },
        caregiver: { include: { profile: true } },
      }
    });

    const result = complaints.map(c => ({
      id: c.id,
      clientId: c.clientId,
      clientName: c.client.profile ? `${c.client.profile.firstName} ${c.client.profile.lastName}` : 'Unknown',
      clientEmail: c.client.email,
      clientPhone: c.client.phone || 'N/A',
      caregiverId: c.caregiverId,
      caregiverName: c.caregiver.profile ? `${c.caregiver.profile.firstName} ${c.caregiver.profile.lastName}` : 'Unknown',
      caregiverEmail: c.caregiver.email,
      caregiverPhone: c.caregiver.phone || 'N/A',
      description: c.description,
      status: c.status,
      date: c.date,
      adminReply: c.adminReply,
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

// GET /api/complaints/history/:clientId
export const getClientComplaints = async (req: Request, res: Response) => {
  try {
    const clientId = req.params.clientId as string;
    const complaints = await prisma.complaint.findMany({
      where: { clientId },
      include: {
        caregiver: { include: { profile: true } },
        client: { include: { profile: true } },
      }
    });

    const result = complaints.map(c => ({
      id: c.id,
      clientId: c.clientId,
      clientName: c.client.profile ? `${c.client.profile.firstName} ${c.client.profile.lastName}` : 'Unknown',
      clientEmail: c.client.email,
      clientPhone: c.client.phone || 'N/A',
      caregiverId: c.caregiverId,
      caregiverName: c.caregiver.profile ? `${c.caregiver.profile.firstName} ${c.caregiver.profile.lastName}` : 'Unknown',
      caregiverEmail: c.caregiver.email,
      caregiverPhone: c.caregiver.phone || 'N/A',
      description: c.description,
      status: c.status,
      date: c.date,
      adminReply: c.adminReply,
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch client complaints' });
  }
};

// POST /api/complaints/reply
export const replyToComplaint = async (req: Request, res: Response) => {
  try {
    const complaintId = String(req.body.complaintId);
    const reply = String(req.body.reply);

    await prisma.complaint.update({
      where: { id: complaintId },
      data: { adminReply: reply, status: 'REVIEWED' }
    });

    res.json({ message: 'Reply sent' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error: ' + error.message });
  }
};

// GET /api/complaints/pending
export const getPendingComplaints = async (req: Request, res: Response) => {
  try {
    const complaints = await prisma.complaint.findMany({ where: { status: 'PENDING' } });
    res.json(complaints);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch pending complaints' });
  }
};
