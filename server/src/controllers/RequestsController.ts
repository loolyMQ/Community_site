import { Request, Response } from 'express';
import { prisma } from '../config/database';

export class RequestsController {
  static async getJoinRequests(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query as { status?: string };

      const where: any = { isArchived: false };
      if (status === 'pending') where.status = 'PENDING';
      if (status === 'approved') where.status = 'APPROVED';
      if (status === 'rejected') where.status = 'REJECTED';

      const requests = await prisma.joinRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          community: { select: { id: true, name: true } }
        }
      });

      res.json({ success: true, data: requests });
    } catch (error) {
      console.error('Error fetching join requests:', error);
      res.status(500).json({ success: false, message: 'Ошибка получения заявок на вступление' });
    }
  }

  static async getCollaborationRequests(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query as { status?: string };

      const where: any = { isArchived: false };
      if (status === 'pending') where.status = 'PENDING';
      if (status === 'approved') where.status = 'APPROVED';
      if (status === 'rejected') where.status = 'REJECTED';

      const requests = await prisma.collaborationRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          community: { select: { id: true, name: true } }
        }
      });

      res.json({ success: true, data: requests });
    } catch (error) {
      console.error('Error fetching collaboration requests:', error);
      res.status(500).json({ success: false, message: 'Ошибка получения заявок на сотрудничество' });
    }
  }
}


