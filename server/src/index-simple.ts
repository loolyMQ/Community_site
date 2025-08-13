import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;

// Настройка безопасности с Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5173"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  }
}));

// Настройка CORS
const corsOptions = {
  origin: process.env['NODE_ENV'] === 'production' 
    ? process.env['CORS_ORIGIN_PROD'] 
    : process.env['CORS_ORIGIN'] || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 минут
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // максимум 100 запросов
  message: {
    success: false,
    message: 'Слишком много запросов с вашего IP, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Логирование
if (process.env['NODE_ENV'] === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Простые маршруты для демонстрации
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// Мок API для аутентификации
app.post('/api/auth/login', (_req, res) => {
  const { email, password } = _req.body;
  
  // Простая проверка для демо
  if (email === 'admin@university.edu' && password === 'Admin123!') {
    res.json({
      success: true,
      message: 'Успешный вход',
      data: {
        user: {
          id: 'admin-1',
          name: 'Администратор Системы',
          email: 'admin@university.edu',
          role: 'admin'
        },
        accessToken: 'mock-access-token-admin',
        refreshToken: 'mock-refresh-token-admin'
      }
    });
  } else if (email === 'moderator@university.edu' && password === 'Moderator123!') {
    res.json({
      success: true,
      message: 'Успешный вход',
      data: {
        user: {
          id: 'moderator-1',
          name: 'Модератор Студсовета',
          email: 'moderator@university.edu',
          role: 'moderator'
        },
        accessToken: 'mock-access-token-moderator',
        refreshToken: 'mock-refresh-token-moderator'
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Неверный email или пароль'
    });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.json({
    success: true,
    message: 'Успешный выход'
  });
});

app.get('/api/auth/profile', (_req, res) => {
  // Мок профиль пользователя
  res.json({
    success: true,
    data: {
      user: {
        id: 'admin-1',
        name: 'Администратор Системы',
        email: 'admin@university.edu',
        role: 'admin',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    }
  });
});

// Обработка 404
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут не найден'
  });
});

// Глобальная обработка ошибок
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: process.env['NODE_ENV'] === 'production' 
      ? 'Внутренняя ошибка сервера' 
      : error.message
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  console.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
  console.log(`📝 Logging: ${process.env['NODE_ENV'] === 'production' ? 'combined' : 'dev'}`);
});

export default app; 