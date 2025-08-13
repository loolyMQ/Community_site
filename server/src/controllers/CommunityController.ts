import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { validationResult } from 'express-validator';

// Функция для санитизации HTML
const sanitizeHtml = (value: string): string => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/[<>]/g, '') // Удаляем < и >
    .replace(/javascript:/gi, '') // Удаляем javascript:
    .replace(/on\w+=/gi, '') // Удаляем обработчики событий
    .trim();
};

// Функция для валидации и санитизации данных сообщества
const sanitizeCommunityData = (data: any) => {
  return {
    name: sanitizeHtml(data.name),
    description: sanitizeHtml(data.description),
    contacts: data.contacts ? {
      social: sanitizeHtml(data.contacts.social || ''),
      phone: sanitizeHtml(data.contacts.phone || ''),
      email: sanitizeHtml(data.contacts.email || ''),
      website: sanitizeHtml(data.contacts.website || '')
    } : undefined,
    leader: data.leader ? {
      name: sanitizeHtml(data.leader.name || ''),
      social: sanitizeHtml(data.leader.social || '')
    } : undefined
  };
};

// Получение всех сообществ
export const getAllCommunities = async (_req: Request, res: Response): Promise<void> => {
  try {
    const communities = await prisma.community.findMany({
      where: { isActive: true },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        leader: {
          select: {
            id: true,
            name: true,
            telegram: true,
            vk: true,
            website: true,
            other: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: communities
    });
  } catch (error) {
    console.error('Ошибка получения сообществ:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении сообществ'
    });
  }
};

// Получение сообщества по ID
export const getCommunityById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Некорректный ID сообщества'
      });
      return;
    }

    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        leader: {
          select: {
            id: true,
            name: true,
            telegram: true,
            vk: true,
            website: true,
            other: true
          }
        }
      }
    });

    if (!community) {
      res.status(404).json({
        success: false,
        message: 'Сообщество не найдено'
      });
      return;
    }

    res.json({
      success: true,
      data: community
    });
  } catch (error) {
    console.error('Ошибка получения сообщества:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении сообщества'
    });
  }
};

// Создание нового сообщества
export const createCommunity = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Ошибки валидации',
        errors: errors.array()
      });
      return;
    }

    // Санитизируем входные данные
    const sanitizedData = sanitizeCommunityData(req.body);
    
    // Дополнительная валидация
    if (!sanitizedData.name || sanitizedData.name.length < 2) {
      res.status(400).json({
        success: false,
        message: 'Название сообщества должно содержать минимум 2 символа'
      });
      return;
    }

    if (!sanitizedData.description || sanitizedData.description.length < 10) {
      res.status(400).json({
        success: false,
        message: 'Описание должно содержать минимум 10 символов'
      });
      return;
    }

    // Проверяем уникальность названия
    const existingCommunity = await prisma.community.findFirst({
      where: {
        name: sanitizedData.name,
        isActive: true
      }
    });

    if (existingCommunity) {
      res.status(400).json({
        success: false,
        message: 'Сообщество с таким названием уже существует'
      });
      return;
    }

    // Найдем или создадим лидера
    let leaderId = 'default-leader-id';
    if (sanitizedData.leader?.name) {
      const existingLeader = await prisma.user.findFirst({
        where: { name: sanitizedData.leader.name }
      });
      
      if (existingLeader) {
        leaderId = existingLeader.id;
      } else {
        // Создаем нового пользователя как лидера
        const newLeader = await prisma.user.create({
          data: {
            name: sanitizedData.leader.name,
            password: 'default-password', // Временно
            email: `leader-${Date.now()}@example.com` // Временно
          }
        });
        leaderId = newLeader.id;
      }
    }

    // Определяем тип контакта и сохраняем в соответствующее поле
    let telegram = null;
    let vk = null;
    let website = null;
    
    if (sanitizedData.contacts?.social) {
      const socialUrl = sanitizedData.contacts.social;
      if (socialUrl.includes('t.me') || socialUrl.includes('telegram')) {
        telegram = socialUrl;
      } else if (socialUrl.includes('vk.com')) {
        vk = socialUrl;
      } else if (socialUrl.includes('http')) {
        website = socialUrl;
      }
    }

    const community = await prisma.community.create({
      data: {
        name: sanitizedData.name,
        description: sanitizedData.description,
        isOfficial: false,
        isActive: true,
        leaderId: leaderId,
        telegram: telegram,
        vk: vk,
        website: website
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        leader: {
          select: {
            id: true,
            name: true,
            telegram: true,
            vk: true,
            website: true,
            other: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Сообщество успешно создано',
      data: community
    });
  } catch (error) {
    console.error('Ошибка создания сообщества:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании сообщества'
    });
  }
};

// Обновление сообщества
export const updateCommunity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;

    // Проверяем права доступа - только администраторы могут редактировать сообщества
    if (userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Недостаточно прав для редактирования сообществ. Только администраторы могут редактировать сообщества.'
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Ошибки валидации',
        errors: errors.array()
      });
      return;
    }

    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Некорректный ID сообщества'
      });
      return;
    }

    // Проверяем существование сообщества
    const existingCommunity = await prisma.community.findUnique({
      where: { id }
    });

    if (!existingCommunity) {
      res.status(404).json({
        success: false,
        message: 'Сообщество не найдено'
      });
      return;
    }

    // Санитизируем входные данные
    const sanitizedData = sanitizeCommunityData(req.body);

    // Дополнительная валидация
    if (sanitizedData.name && sanitizedData.name.length < 2) {
      res.status(400).json({
        success: false,
        message: 'Название сообщества должно содержать минимум 2 символа'
      });
      return;
    }

    if (sanitizedData.description && sanitizedData.description.length < 10) {
      res.status(400).json({
        success: false,
        message: 'Описание должно содержать минимум 10 символов'
      });
      return;
    }

    // Проверяем уникальность названия (если оно изменилось)
    if (sanitizedData.name && sanitizedData.name !== existingCommunity.name) {
      const duplicateCommunity = await prisma.community.findFirst({
        where: {
          name: sanitizedData.name,
          isActive: true,
          id: { not: id }
        }
      });

      if (duplicateCommunity) {
        res.status(400).json({
          success: false,
          message: 'Сообщество с таким названием уже существует'
        });
        return;
      }
    }

    // Определяем тип контакта и сохраняем в соответствующее поле
    let telegram = null;
    let vk = null;
    let website = null;
    
    if (sanitizedData.contacts?.social) {
      const socialUrl = sanitizedData.contacts.social;
      if (socialUrl.includes('t.me') || socialUrl.includes('telegram')) {
        telegram = socialUrl;
      } else if (socialUrl.includes('vk.com')) {
        vk = socialUrl;
      } else if (socialUrl.includes('http')) {
        website = socialUrl;
      }
    }

    // Обновляем лидера, если данные предоставлены
    if (sanitizedData.leader) {
      const leaderId = existingCommunity.leaderId;
      
      // Получаем текущие данные лидера
      const currentLeader = await prisma.user.findUnique({
        where: { id: leaderId }
      });
      
      if (currentLeader) {
        // Определяем тип контакта лидера
        let leaderTelegram = currentLeader.telegram || [];
        let leaderVk = currentLeader.vk || [];
        let leaderWebsite = currentLeader.website || [];
        
        if (sanitizedData.leader.social) {
          const leaderSocialUrl = sanitizedData.leader.social;
          if (leaderSocialUrl.includes('t.me') || leaderSocialUrl.includes('telegram')) {
            leaderTelegram = [leaderSocialUrl];
          } else if (leaderSocialUrl.includes('vk.com')) {
            leaderVk = [leaderSocialUrl];
          } else if (leaderSocialUrl.includes('http')) {
            leaderWebsite = [leaderSocialUrl];
          }
        }

        // Обновляем данные лидера
        await prisma.user.update({
          where: { id: leaderId },
          data: {
            name: sanitizedData.leader.name || currentLeader.name,
            telegram: leaderTelegram,
            vk: leaderVk,
            website: leaderWebsite
          }
        });
      }
    }

    const updatedCommunity = await prisma.community.update({
      where: { id },
      data: {
        name: sanitizedData.name,
        description: sanitizedData.description,
        telegram: telegram,
        vk: vk,
        website: website
      },
      include: {
        categories: {
          include: {
            category: true
          }
        },
        leader: {
          select: {
            id: true,
            name: true,
            telegram: true,
            vk: true,
            website: true,
            other: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Сообщество успешно обновлено',
      data: updatedCommunity
    });
  } catch (error) {
    console.error('Ошибка обновления сообщества:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении сообщества'
    });
  }
};

// Удаление сообщества
export const deleteCommunity = async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;

    // Проверяем права доступа - только администраторы могут удалять сообщества
    if (userRole !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Недостаточно прав для удаления сообществ. Только администраторы могут удалять сообщества.'
      });
      return;
    }

    const { id } = req.params;

    if (!id || typeof id !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Некорректный ID сообщества'
      });
      return;
    }

    // Проверяем существование сообщества
    const existingCommunity = await prisma.community.findUnique({
      where: { id }
    });

    if (!existingCommunity) {
      res.status(404).json({
        success: false,
        message: 'Сообщество не найдено'
      });
      return;
    }

    // Мягкое удаление (устанавливаем isActive = false)
    await prisma.community.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Сообщество успешно удалено'
    });
  } catch (error) {
    console.error('Ошибка удаления сообщества:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при удалении сообщества'
    });
  }
};

// Получение статистики для админ панели
export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const totalCommunities = await prisma.community.count({
      where: { isActive: true }
    });
    const totalReviews = await prisma.review.count({
      where: { isActive: true }
    });
    const pendingReviews = await prisma.review.count({
      where: {
        isActive: true,
        isPublished: false
      }
    });
    const totalJoinRequests = 0; // Placeholder
    const pendingJoinRequests = 0; // Placeholder
    const totalCollaborationRequests = 0; // Placeholder
    const pendingCollaborationRequests = 0; // Placeholder

    const stats = {
      totalCommunities,
      totalJoinRequests,
      pendingJoinRequests,
      totalCollaborationRequests,
      pendingCollaborationRequests,
      totalReviews,
      pendingReviews
    };
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Ошибка при получении статистики админ панели:', error);
    res.status(500).json({ error: 'Ошибка сервера при получении статистики' });
  }
}; 

// Получение всех категорий
export const getAllCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    const categoriesWithCount = categories.map((category: any) => ({
      ...category,
      communityCount: 0 // Placeholder, можно добавить подсчет позже
    }));

    res.json({
      success: true,
      data: categoriesWithCount
    });
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении категорий'
    });
  }
};

// Получение связей между сообществами
export const getCommunityRelationships = async (_req: Request, res: Response): Promise<void> => {
  try {
    const relationships = await prisma.communityRelationship.findMany({
      where: {
        sourceCommunity: { isActive: true },
        targetCommunity: { isActive: true }
      },
      include: {
        sourceCommunity: {
          select: {
            id: true,
            name: true
          }
        },
        targetCommunity: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: relationships
    });
  } catch (error) {
    console.error('Ошибка получения связей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении связей'
    });
  }
};

// Поиск сообществ
export const searchCommunities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Параметр поиска обязателен'
      });
      return;
    }

    const communities = await prisma.community.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      },
      include: {
        categories: true,
        leader: {
          select: {
            id: true,
            name: true,
            telegram: true,
            vk: true,
            website: true,
            other: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: communities
    });
  } catch (error) {
    console.error('Ошибка поиска сообществ:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при поиске сообществ'
    });
  }
};

// Обновление категорий сообщества
export const updateCommunityCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { mainCategoryId, categoryIds } = req.body;

    if (!id || typeof id !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Некорректный ID сообщества'
      });
      return;
    }

    // Проверяем существование сообщества
    const existingCommunity = await prisma.community.findUnique({
      where: { id }
    });

    if (!existingCommunity) {
      res.status(404).json({
        success: false,
        message: 'Сообщество не найдено'
      });
      return;
    }

    // Обновляем сообщество
    const updatedCommunity = await prisma.community.update({
      where: { id },
      data: {
        mainCategoryId,
        categoryIds: categoryIds || []
      },
      include: {
        categories: true,
        leader: {
          select: {
            id: true,
            name: true,
            telegram: true,
            vk: true,
            website: true,
            other: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Категории сообщества успешно обновлены',
      data: updatedCommunity
    });
  } catch (error) {
    console.error('Ошибка обновления категорий сообщества:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при обновлении категорий'
    });
  }
}; 