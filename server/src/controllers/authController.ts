import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import { prisma } from '../config/database';

// Хранилище попыток входа (в продакшене использовать Redis)
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>();

// Генерация JWT токенов
const generateTokens = (user: { id: string; email: string; role: string }) => {
  const jwtSecret = process.env['JWT_SECRET'];
  const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'];
  
  if (!jwtSecret || !jwtRefreshSecret) {
    throw new Error('JWT secrets not configured');
  }

  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    },
    jwtSecret,
    { expiresIn: process.env['JWT_EXPIRES_IN'] || '15m' }
  );

  const refreshToken = jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      iat: Math.floor(Date.now() / 1000)
    },
    jwtRefreshSecret,
    { expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d' }
  );

  return { accessToken, refreshToken };
};

// Проверка блокировки IP
const checkIpLockout = (ip: string): boolean => {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return false;

  const maxAttempts = parseInt(process.env['MAX_LOGIN_ATTEMPTS'] || '5');
  const lockoutDuration = parseInt(process.env['LOCKOUT_DURATION'] || '900000');

  if (attempts.count >= maxAttempts) {
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      return true; // IP заблокирован
    } else {
      // Сброс блокировки
      loginAttempts.delete(ip);
      return false;
    }
  }

  return false;
};

// Увеличение счетчика попыток входа
const incrementLoginAttempts = (ip: string): void => {
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  attempts.count++;
  attempts.lastAttempt = Date.now();

  const maxAttempts = parseInt(process.env['MAX_LOGIN_ATTEMPTS'] || '5');
  const lockoutDuration = parseInt(process.env['LOCKOUT_DURATION'] || '900000');

  if (attempts.count >= maxAttempts) {
    attempts.lockedUntil = Date.now() + lockoutDuration;
  }

  loginAttempts.set(ip, attempts);
};

// Сброс счетчика попыток входа
const resetLoginAttempts = (ip: string): void => {
  loginAttempts.delete(ip);
};

// Логирование безопасности
const logSecurityEvent = (event: string, details: any): void => {
  console.log(`🔒 SECURITY: ${event}`, {
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Проверка админ учетных данных
const checkAdminCredentials = async (email: string, password: string): Promise<boolean> => {
  const adminEmail = process.env['ADMIN_EMAIL'];
  const adminHash = process.env['ADMIN_PASSWORD_HASH'];
  const moderatorEmail = process.env['MODERATOR_EMAIL'];
  const moderatorHash = process.env['MODERATOR_PASSWORD_HASH'];

  if (email === adminEmail && adminHash) {
    return await bcrypt.compare(password, adminHash);
  }

  if (email === moderatorEmail && moderatorHash) {
    return await bcrypt.compare(password, moderatorHash);
  }

  return false;
};

// Регистрация пользователя
export const register = async (req: Request, res: Response): Promise<void> => {
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

    const { name, email, password, role = 'STUDENT' } = req.body;

    // Дополнительная валидация
    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Пароль должен содержать минимум 8 символов'
      });
      return;
    }

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
      return;
    }

    // Хешируем пароль с увеличенным количеством раундов
    const bcryptRounds = parseInt(process.env['BCRYPT_ROUNDS'] || '14');
    const hashedPassword = await bcrypt.hash(password, bcryptRounds);

    // Создаем нового пользователя
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role
      }
    });

    // Генерируем токены
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email || '',
      role: user.role
    });

    logSecurityEvent('USER_REGISTERED', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Пользователь успешно зарегистрирован',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    logSecurityEvent('REGISTRATION_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при регистрации'
    });
  }
};

// Вход пользователя
export const login = async (req: Request, res: Response): Promise<void> => {
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

    const { email, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';

    // Проверяем блокировку IP
    if (checkIpLockout(clientIp)) {
      logSecurityEvent('LOGIN_BLOCKED_IP', {
        ip: clientIp,
        reason: 'Too many failed attempts'
      });
      res.status(429).json({
        success: false,
        message: 'Слишком много неудачных попыток входа. Попробуйте позже.'
      });
      return;
    }

    // Сначала проверяем админ учетные данные
    const isAdminLogin = await checkAdminCredentials(email, password);
    if (isAdminLogin) {
      // Определяем роль
      const adminEmail = process.env['ADMIN_EMAIL'];
      const moderatorEmail = process.env['MODERATOR_EMAIL'];
      const role = email === adminEmail ? 'ADMIN' : 'MODERATOR';
      const name = email === adminEmail ? 'Администратор Системы' : 'Модератор Студсовета';

      // Сбрасываем счетчик попыток входа
      resetLoginAttempts(clientIp);

      // Создаем мок пользователя для админа
      const adminUser = {
        id: `admin-${Date.now()}`,
        email,
        name,
        role
      };

      // Генерируем токены
      const { accessToken, refreshToken } = generateTokens(adminUser);

      logSecurityEvent('ADMIN_LOGIN_SUCCESS', {
        email: adminUser.email,
        role: adminUser.role,
        ip: clientIp
      });

      res.json({
        success: true,
        message: 'Успешный вход',
        data: {
          user: adminUser,
          accessToken,
          refreshToken
        }
      });
      return;
    }

    // Находим пользователя в базе данных
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    
    if (!user) {
      incrementLoginAttempts(clientIp);
      logSecurityEvent('LOGIN_FAILED', {
        email: email,
        ip: clientIp,
        reason: 'User not found'
      });
      res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
      return;
    }

    // Проверяем активность пользователя
    if (!user.isActive) {
      incrementLoginAttempts(clientIp);
      logSecurityEvent('LOGIN_FAILED', {
        userId: user.id,
        email: user.email,
        ip: clientIp,
        reason: 'Account deactivated'
      });
      res.status(401).json({
        success: false,
        message: 'Аккаунт деактивирован'
      });
      return;
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      incrementLoginAttempts(clientIp);
      logSecurityEvent('LOGIN_FAILED', {
        userId: user.id,
        email: user.email,
        ip: clientIp,
        reason: 'Invalid password'
      });
      res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
      return;
    }

    // Сбрасываем счетчик попыток входа
    resetLoginAttempts(clientIp);

    // Обновляем время последнего входа
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Генерируем токены
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email || '',
      role: user.role
    });

    logSecurityEvent('LOGIN_SUCCESS', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: clientIp
    });

    res.json({
      success: true,
      message: 'Успешный вход',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    logSecurityEvent('LOGIN_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip
    });
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при входе'
    });
  }
};

// Обновление токена
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
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

    const { refreshToken: token } = req.body;
    const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'];

    if (!jwtRefreshSecret) {
      throw new Error('JWT_REFRESH_SECRET не настроен');
    }

    const decoded = jwt.verify(token, jwtRefreshSecret) as any;
    
    // Проверяем существование пользователя
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Пользователь не найден или деактивирован'
      });
      return;
    }

    // Генерируем новые токены
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      id: user.id,
      email: user.email || '',
      role: user.role
    });

    logSecurityEvent('TOKEN_REFRESHED', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Токен обновлен',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logSecurityEvent('TOKEN_REFRESH_FAILED', {
        reason: 'Invalid token',
        ip: req.ip
      });
      res.status(401).json({
        success: false,
        message: 'Недействительный токен'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      logSecurityEvent('TOKEN_REFRESH_FAILED', {
        reason: 'Token expired',
        ip: req.ip
      });
      res.status(401).json({
        success: false,
        message: 'Токен истек'
      });
    } else {
      console.error('Ошибка обновления токена:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка сервера при обновлении токена'
      });
    }
  }
};

// Выход пользователя
export const logout = async (_req: Request, res: Response): Promise<void> => {
  try {
    // В реальном приложении здесь можно добавить токен в черный список
    logSecurityEvent('USER_LOGOUT', {
      ip: _req.ip
    });
    
    res.json({
      success: true,
      message: 'Успешный выход'
    });
  } catch (error) {
    console.error('Ошибка выхода:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при выходе'
    });
  }
};

// Получение профиля пользователя
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        studentId: true,
        faculty: true,
        course: true,
        group: true,
        bio: true,
        isActive: true,
        isVerified: true,
        lastLogin: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
      return;
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка сервера при получении профиля'
    });
  }
};
