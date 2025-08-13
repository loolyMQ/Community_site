import { Router } from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  refreshToken, 
  logout, 
  getProfile 
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Функция для санитизации HTML
const sanitizeHtml = (value: string): string => {
  return value
    .replace(/[<>]/g, '') // Удаляем < и >
    .replace(/javascript:/gi, '') // Удаляем javascript:
    .replace(/on\w+=/gi, '') // Удаляем обработчики событий
    .trim();
};

// Валидация для регистрации
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Имя должно содержать от 2 до 100 символов')
    .customSanitizer(sanitizeHtml)
    .matches(/^[а-яёa-z\s\-']+$/i)
    .withMessage('Имя может содержать только буквы, пробелы, дефисы и апострофы'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Некорректный email адрес')
    .isLength({ max: 255 })
    .withMessage('Email слишком длинный'),
  
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Пароль должен содержать от 8 до 128 символов')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы')
    .custom((value) => {
      // Проверяем на простые пароли
      const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'user'];
      if (commonPasswords.includes(value.toLowerCase())) {
        throw new Error('Пароль слишком простой');
      }
      return true;
    }),
  
  body('role')
    .optional()
    .isIn(['ADMIN', 'MODERATOR', 'STUDENT'])
    .withMessage('Некорректная роль')
];

// Валидация для входа
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Некорректный email адрес')
    .isLength({ max: 255 })
    .withMessage('Email слишком длинный'),
  
  body('password')
    .notEmpty()
    .withMessage('Пароль обязателен')
    .isLength({ max: 128 })
    .withMessage('Пароль слишком длинный')
];

// Валидация для обновления токена
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token обязателен')
    .isJWT()
    .withMessage('Некорректный формат токена')
];

// Маршруты
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refreshTokenValidation, refreshToken);
router.post('/logout', logout);
router.get('/profile', authenticateToken, getProfile);

export default router; 