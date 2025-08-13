import { User } from '../types';

// Конфигурация безопасности
const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 минут
  sessionTimeout: 30 * 60 * 1000, // 30 минут
  passwordMinLength: 8,
  requireSpecialChars: true,
  requireNumbers: true,
  requireUppercase: true
};

// Хранилище попыток входа (в реальном приложении это должно быть в базе данных)
const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil?: number }>();

// Хранилище активных сессий (в реальном приложении это должно быть в базе данных)
const activeSessions = new Map<string, { userId: string; role: string; expiresAt: number }>();

// Генерация безопасного токена сессии
export const generateSessionToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Проверка сложности пароля
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < SECURITY_CONFIG.passwordMinLength) {
    errors.push(`Пароль должен содержать минимум ${SECURITY_CONFIG.passwordMinLength} символов`);
  }
  
  if (SECURITY_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Пароль должен содержать заглавные буквы');
  }
  
  if (SECURITY_CONFIG.requireNumbers && !/\d/.test(password)) {
    errors.push('Пароль должен содержать цифры');
  }
  
  if (SECURITY_CONFIG.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Пароль должен содержать специальные символы');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Проверка блокировки аккаунта
export const isAccountLocked = (email: string): boolean => {
  const attempts = loginAttempts.get(email);
  if (!attempts) return false;
  
  if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
    return true;
  }
  
  // Сброс блокировки если время истекло
  if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
    loginAttempts.delete(email);
    return false;
  }
  
  return false;
};

// Получение времени до разблокировки
export const getLockoutTimeRemaining = (email: string): number => {
  const attempts = loginAttempts.get(email);
  if (!attempts || !attempts.lockedUntil) return 0;
  
  const remaining = attempts.lockedUntil - Date.now();
  return remaining > 0 ? remaining : 0;
};

// Регистрация попытки входа
export const recordLoginAttempt = (email: string, success: boolean): void => {
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
  
  if (success) {
    // Успешный вход - сброс счетчика
    loginAttempts.delete(email);
  } else {
    // Неудачная попытка
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    
    // Блокировка после превышения лимита
    if (attempts.count >= SECURITY_CONFIG.maxLoginAttempts) {
      attempts.lockedUntil = Date.now() + SECURITY_CONFIG.lockoutDuration;
    }
    
    loginAttempts.set(email, attempts);
  }
};

// Создание сессии пользователя
export const createUserSession = (user: User): string => {
  const sessionToken = generateSessionToken();
  const expiresAt = Date.now() + SECURITY_CONFIG.sessionTimeout;
  
  activeSessions.set(sessionToken, {
    userId: user.id,
    role: user.role,
    expiresAt
  });
  
  // Сохранение токена в localStorage с флагом безопасности
  localStorage.setItem('sessionToken', sessionToken);
  localStorage.setItem('sessionExpires', expiresAt.toString());
  
  return sessionToken;
};

// Проверка валидности сессии
export const validateSession = (): { isValid: boolean; user?: { id: string; role: string } } => {
  const sessionToken = localStorage.getItem('sessionToken');
  const sessionExpires = localStorage.getItem('sessionExpires');
  
  if (!sessionToken || !sessionExpires) {
    return { isValid: false };
  }
  
  const expiresAt = parseInt(sessionExpires);
  if (Date.now() > expiresAt) {
    // Сессия истекла
    destroySession();
    return { isValid: false };
  }
  
  const session = activeSessions.get(sessionToken);
  if (!session) {
    return { isValid: false };
  }
  
  return {
    isValid: true,
    user: {
      id: session.userId,
      role: session.role
    }
  };
};

// Уничтожение сессии
export const destroySession = (): void => {
  const sessionToken = localStorage.getItem('sessionToken');
  if (sessionToken) {
    activeSessions.delete(sessionToken);
  }
  
  localStorage.removeItem('sessionToken');
  localStorage.removeItem('sessionExpires');
};

// Проверка прав доступа
export const checkPermission = (requiredRole: 'admin' | 'moderator', userRole: string): boolean => {
  const roleHierarchy = {
    'admin': 2,
    'moderator': 1,
    'user': 0
  };
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole];
  
  return userLevel >= requiredLevel;
};

// Санитизация входных данных
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Удаление потенциально опасных символов
    .substring(0, 1000); // Ограничение длины
};

// Валидация email
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Логирование событий безопасности
export const logSecurityEvent = (event: string, details: any): void => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    ip: 'client-side' // В реальном приложении IP будет получен с сервера
  };
  
  console.log('Security Event:', logEntry);
  // В реальном приложении здесь будет отправка на сервер
};

// Очистка устаревших сессий и попыток входа
export const cleanupExpiredData = (): void => {
  const now = Date.now();
  
  // Очистка устаревших сессий
  for (const [token, session] of activeSessions.entries()) {
    if (session.expiresAt < now) {
      activeSessions.delete(token);
    }
  }
  
  // Очистка устаревших попыток входа
  for (const [email, attempts] of loginAttempts.entries()) {
    if (attempts.lockedUntil && attempts.lockedUntil < now) {
      loginAttempts.delete(email);
    }
  }
};

// Запуск периодической очистки
setInterval(cleanupExpiredData, 5 * 60 * 1000); // Каждые 5 минут 