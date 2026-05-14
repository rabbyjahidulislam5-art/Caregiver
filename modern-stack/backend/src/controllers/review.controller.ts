import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/reviews
export const createReview = async (req: Request, res: Response) => {
  try {
    const { clientId, caregiverId, rating, comment } = req.body;
    const review = await prisma.review.create({
      data: {
        clientId,
        caregiverId,
        rating: parseInt(String(rating)),
        comment: comment || null,
        status: 'published',
      }
    });
    res.status(201).json(review);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create review' });
  }
};

// GET /api/caregivers/:caregiverId/reviews
export const getCaregiverReviews = async (req: Request, res: Response) => {
  try {
    const caregiverId = req.params.caregiverId as string;
    const reviews = await prisma.review.findMany({
      where: { caregiverId },
      include: { client: { include: { profile: true } } }
    });

    const result = reviews.map(r => ({
      reviewId: r.id,
      reviewerName: r.client.profile ? `${r.client.profile.firstName} ${r.client.profile.lastName}` : 'Anonymous',
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};
