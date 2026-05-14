import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/schedule/add
export const addSchedule = async (req: Request, res: Response) => {
  try {
    const { caregiverId, dayOfWeek, startTime, endTime } = req.body;
    const schedule = await prisma.schedule.create({
      data: {
        caregiverId,
        dayOfWeek: String(dayOfWeek),
        startTime: String(startTime),
        endTime: String(endTime),
        isAvailable: true,
      }
    });
    res.status(201).json(schedule);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add schedule' });
  }
};

// GET /api/schedule/:caregiverId
export const getSchedules = async (req: Request, res: Response) => {
  try {
    const caregiverId = req.params.caregiverId as string;
    const schedules = await prisma.schedule.findMany({ where: { caregiverId } });
    res.json(schedules);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

// DELETE /api/schedule/:scheduleId
export const deleteSchedule = async (req: Request, res: Response) => {
  try {
    const scheduleId = req.params.scheduleId as string;
    await prisma.schedule.delete({ where: { id: scheduleId } });
    res.json({ message: 'Schedule deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
};
