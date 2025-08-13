import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

// Расширение интерфейса Request для добавления пользователя
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        name: string;
        role: string;
      };
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Middleware для проверки JWT токена
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Токен доступа не предоставлен' 
      });
      return;
    }

    // Проверяем формат токена
    if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
      res.status(401).json({ 
        success: false, 
        message: 'Неверный формат токена' 
      });
      return;
    }

    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new Error('JWT_SECRET не настроен');
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // Проверяем время создания токена (не старше 24 часов)
    const tokenAge = Date.now() - (decoded.iat * 1000);
    const maxTokenAge = 24 * 60 * 60 * 1000; // 24 часа
    if (tokenAge > maxTokenAge) {
      res.status(401).json({ 
        success: false, 
        message: 'Токен слишком старый' 
      });
      return;
    }

    // Проверяем, является ли это админ токеном
    if (decoded.userId.startsWith('admin-')) {
      // Для админов проверяем email и роль из токена
      const adminEmail = process.env['ADMIN_EMAIL'];
      const moderatorEmail = process.env['MODERATOR_EMAIL'];
      
      if (decoded.email === adminEmail || decoded.email === moderatorEmail) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          name: decoded.email === adminEmail ? 'Администратор Системы' : 'Модератор Студсовета',
          role: decoded.role
        };
        next();
        return;
      }
    }

    // Для обычных пользователей проверяем существование в базе данных
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
        lastLogin: true
      }
    });
    
    if (!user) {
      res.status(401).json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
      return;
    }

    // Проверяем активность пользователя
    if (!user.isActive) {
      res.status(401).json({ 
        success: false, 
        message: 'Аккаунт деактивирован' 
      });
      return;
    }

    // Проверяем соответствие email в токене и базе данных
    if (decoded.email !== user.email) {
      res.status(401).json({ 
        success: false, 
        message: 'Недействительный токен' 
      });
      return;
    }

    // Добавляем информацию о пользователе в запрос
    req.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        success: false, 
        message: 'Недействительный токен' 
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        success: false, 
        message: 'Токен истек' 
      });
    } else {
      console.error('Ошибка аутентификации:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Ошибка сервера при аутентификации' 
      });
    }
  }
};

// Middleware для проверки ролей
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Пользователь не аутентифицирован' 
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        message: 'Недостаточно прав для выполнения операции' 
      });
      return;
    }

    next();
  };
};

// Middleware для проверки прав администратора
export const requireAdmin = requireRole(['ADMIN']);

// Middleware для проверки прав модератора или администратора
export const requireModerator = requireRole(['ADMIN', 'MODERATOR']);

// Middleware для проверки владельца ресурса или администратора
export const requireOwnerOrAdmin = (resourceUserIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'Пользователь не аутентифицирован' 
      });
      return;
    }

    // Администраторы и модераторы имеют доступ ко всем ресурсам
    if (['ADMIN', 'MODERATOR'].includes(req.user.role)) {
      next();
      return;
    }

    // Проверяем, является ли пользователь владельцем ресурса
    const resourceUserId = (req.body as any)[resourceUserIdField] || (req.params as any)[resourceUserIdField];
    if (resourceUserId && resourceUserId === req.user.userId) {
      next();
      return;
    }

    res.status(403).json({ 
      success: false, 
      message: 'Недостаточно прав для выполнения операции' 
    });
  };
};

// Middleware для логирования запросов
export const logRequest = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const { method, url, ip, userAgent } = req;
  
  // Логируем запрос
  console.log(`API Request:`, {
    method,
    url,
    status: res.statusCode,
    duration: `${Date.now() - start}ms`,
    userAgent,
    ip: ip || req.connection.remoteAddress,
    userId: req.user?.userId,
    timestamp: new Date().toISOString()
  });

  // Логируем подозрительную активность
  const suspiciousPatterns = [
    /script/i,
    /javascript:/i,
    /on\w+=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i
  ];

  const requestString = JSON.stringify(req.body) + JSON.stringify(req.query) + JSON.stringify(req.params);
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestString));

  if (isSuspicious) {
    console.log(`🚨 SUSPICIOUS ACTIVITY DETECTED:`, {
      ip: ip || req.connection.remoteAddress,
      url,
      method,
      userAgent,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Middleware для защиты от CSRF (базовая реализация)
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Проверяем только для не-GET запросов
  if (req.method === 'GET') {
    next();
    return;
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const allowedOrigin = process.env['CORS_ORIGIN'] || 'http://localhost:5173';

  // Проверяем Origin header
  if (origin && origin !== allowedOrigin) {
    res.status(403).json({
      success: false,
      message: 'Недопустимый источник запроса'
    });
    return;
  }

  // Проверяем Referer header
  if (referer && !referer.startsWith(allowedOrigin)) {
    res.status(403).json({
      success: false,
      message: 'Недопустимый источник запроса'
    });
    return;
  }

  next();
};
