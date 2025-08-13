import { Request, Response } from 'express';
import { prisma } from '../config/database';

interface ReviewQuery {
  page?: string;
  limit?: string;
  status?: string;
}

interface RatingDistribution {
  rating: number;
  _count?: { rating: number };
}

// Кэш для статистики отзывов
const reviewStatsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 600000; // 10 минут

export class ReviewController {
  // Получение опубликованных отзывов сообщества (публичный доступ)
  static async getCommunityReviews(req: Request, res: Response): Promise<void> {
    try {
      const { communityId } = req.params;
      const { page = '1', limit = '10' } = req.query as ReviewQuery;

      if (!communityId) {
        res.status(400).json({
          success: false,
          message: 'ID сообщества не указан'
        });
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const reviews = await prisma.review.findMany({
        where: {
          communityId,
          isActive: true,
          isPublished: true // Только опубликованные отзывы
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              faculty: true,
              course: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: Number(limit)
      });

      const total = await prisma.review.count({
        where: {
          communityId,
          isActive: true,
          isPublished: true
        }
      });

      const averageRating = await prisma.review.aggregate({
        where: {
          communityId,
          isActive: true,
          isPublished: true
        },
        _avg: {
          rating: true
        }
      });

      res.json({
        success: true,
        data: {
          reviews,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          },
          stats: {
            averageRating: averageRating._avg?.rating || 0,
            totalReviews: total
          }
        }
      });
    } catch (error) {
      console.error('Ошибка получения отзывов:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  }

  // Создание отзыва (без авторизации для демо)
  static async createReview(req: Request, res: Response): Promise<void> {
    try {
      const { communityId } = req.params;
      const { rating, title, content, isAnonymous = false } = req.body;
      const userId = (req as any).user?.userId;

      if (!communityId) {
        res.status(400).json({
          success: false,
          message: 'ID сообщества не указан'
        });
        return;
      }

      // Убираем проверку авторизации для демо
      // if (!userId) {
      //   res.status(401).json({
      //     success: false,
      //     message: 'Необходима авторизация через МИФИ для оставления отзыва'
      //   });
      //   return;
      // }

      // Проверяем, что сообщество существует
      const community = await prisma.community.findFirst({
        where: {
          id: communityId,
          isActive: true
        }
      });

      if (!community) {
        res.status(404).json({
          success: false,
          message: 'Сообщество не найдено'
        });
        return;
      }

      // Валидация данных
      if (!rating || rating < 1 || rating > 5) {
        res.status(400).json({
          success: false,
          message: 'Рейтинг должен быть от 1 до 5'
        });
        return;
      }

      if (!content || content.trim().length < 10) {
        res.status(400).json({
          success: false,
          message: 'Содержание отзыва должно содержать минимум 10 символов'
        });
        return;
      }

      // Проверяем, не оставлял ли пользователь уже отзыв (если не анонимный и есть userId)
      if (!isAnonymous && userId) {
        const existingReview = await prisma.review.findFirst({
          where: {
            communityId,
            userId,
            isActive: true
          }
        });

        if (existingReview) {
          res.status(400).json({
            success: false,
            message: 'Вы уже оставляли отзыв для этого сообщества'
          });
          return;
        }
      }

      // Создаем отзыв (ожидает модерации)
      const review = await prisma.review.create({
        data: {
          communityId,
          userId: isAnonymous ? null : userId,
          isAnonymous,
          rating,
          title: title?.trim() || null,
          content: content.trim(),
          isVerified: false, // Требует модерации
          isPublished: false // Не опубликован
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              faculty: true,
              course: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Отзыв отправлен на модерацию',
        data: review
      });
    } catch (error) {
      console.error('Ошибка создания отзыва:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  }

  // Модерация отзыва (только админы/модераторы)
  static async moderateReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const { action, adminComment } = req.body; // action: 'approve' | 'reject'
      const moderatorId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      if (!reviewId) {
        res.status(400).json({
          success: false,
          message: 'ID отзыва не указан'
        });
        return;
      }

      if (!moderatorId) {
        res.status(401).json({
          success: false,
          message: 'Не авторизован'
        });
        return;
      }

      if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
        res.status(403).json({
          success: false,
          message: 'Недостаточно прав для модерации'
        });
        return;
      }

      // Находим отзыв
      const review = await prisma.review.findFirst({
        where: {
          id: reviewId,
          isActive: true
        }
      });

      if (!review) {
        res.status(404).json({
          success: false,
          message: 'Отзыв не найден'
        });
        return;
      }

      if (review.isVerified) {
        res.status(400).json({
          success: false,
          message: 'Отзыв уже прошел модерацию'
        });
        return;
      }

      // Обновляем отзыв
      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: {
          isVerified: true,
          isPublished: action === 'approve',
          adminComment: adminComment?.trim() || null,
          moderatedBy: moderatorId,
          moderatedAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              faculty: true,
              course: true
            }
          }
        }
      });

      res.json({
        success: true,
        message: action === 'approve' ? 'Отзыв одобрен и опубликован' : 'Отзыв отклонен',
        data: updatedReview
      });
    } catch (error) {
      console.error('Ошибка модерации отзыва:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  }

  // Получение отзывов для модерации (админ-панель)
  static async getReviewsForModeration(req: Request, res: Response): Promise<void> {
    try {
      const { page = '1', limit = '20', status = 'pending' } = req.query as ReviewQuery;
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
        res.status(403).json({
          success: false,
          message: 'Недостаточно прав'
        });
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);

      let whereCondition: any = {
        isActive: true
      };

      if (status === 'pending') {
        whereCondition.isVerified = false;
      } else if (status === 'approved') {
        whereCondition.isVerified = true;
        whereCondition.isPublished = true;
      } else if (status === 'rejected') {
        whereCondition.isVerified = true;
        whereCondition.isPublished = false;
      }

      const reviews = await prisma.review.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              faculty: true,
              course: true
            }
          },
          community: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: Number(limit)
      });

      const total = await prisma.review.count({
        where: whereCondition
      });

      res.json({
        success: true,
        data: {
          reviews,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Ошибка получения отзывов для модерации:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  }

  // Получение статистики отзывов (публичный доступ)
  static async getReviewStats(req: Request, res: Response): Promise<void> {
    try {
      const { communityId } = req.params;

      if (!communityId) {
        res.status(400).json({
          success: false,
          message: 'ID сообщества не указан'
        });
        return;
      }

      // Проверяем кэш
      const cached = reviewStatsCache.get(communityId);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        res.json({
          success: true,
          data: cached.data
        });
        return;
      }

      const stats = await prisma.review.aggregate({
        where: {
          communityId,
          isActive: true,
          isPublished: true // Только опубликованные
        },
        _count: {
          id: true
        },
        _avg: {
          rating: true
        }
      });

      // Распределение по рейтингам
      const ratingDistribution = await prisma.review.groupBy({
        by: ['rating'],
        where: {
          communityId,
          isActive: true,
          isPublished: true
        },
        _count: {
          rating: true
        }
      });

      const distribution = ratingDistribution.reduce((acc: Record<number, number>, item: RatingDistribution) => {
        acc[item.rating] = item._count?.rating || 0;
        return acc;
      }, {});

      const resultData = {
        totalReviews: stats._count?.id || 0,
        averageRating: stats._avg?.rating || 0,
        ratingDistribution: distribution
      };

      // Сохраняем в кэш
      reviewStatsCache.set(communityId, {
        data: resultData,
        timestamp: Date.now()
      });

      res.json({
        success: true,
        data: resultData
      });
    } catch (error) {
      console.error('Ошибка получения статистики отзывов:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  }

  // Удаление отзыва (только админы/модераторы)
  static async deleteReview(req: Request, res: Response): Promise<void> {
    try {
      const { reviewId } = req.params;
      const userRole = (req as any).user?.role;

      if (!reviewId) {
        res.status(400).json({
          success: false,
          message: 'ID отзыва не указан'
        });
        return;
      }

      if (userRole !== 'ADMIN' && userRole !== 'MODERATOR') {
        res.status(403).json({
          success: false,
          message: 'Недостаточно прав для удаления отзыва'
        });
        return;
      }

      // Находим отзыв
      const review = await prisma.review.findFirst({
        where: {
          id: reviewId,
          isActive: true
        }
      });

      if (!review) {
        res.status(404).json({
          success: false,
          message: 'Отзыв не найден'
        });
        return;
      }

      // Мягкое удаление
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Отзыв успешно удален'
      });
    } catch (error) {
      console.error('Ошибка удаления отзыва:', error);
      res.status(500).json({
        success: false,
        message: 'Внутренняя ошибка сервера'
      });
    }
  }
}
