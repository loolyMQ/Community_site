import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import { prisma } from './config/database';
import authRoutes from './routes/auth';
import communityRoutes from './routes/communities';
import reviewRoutes from './routes/reviews';
import requestRoutes from './routes/requests';
import { logRequest } from './middleware/auth';

// Загружаем переменные окружения
config({ path: '.env' });

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
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting - ВКЛЮЧАЕМ ДЛЯ БЕЗОПАСНОСТИ
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 минут
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '5000'), // максимум 5000 запросов
  message: {
    success: false,
    message: 'Слишком много запросов с вашего IP, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skipFailedRequests: false
});

// Применяем rate limiting ко всем запросам
app.use(limiter);

// Дополнительный rate limiting для аутентификации
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток входа
  message: {
    success: false,
    message: 'Слишком много попыток входа, попробуйте позже'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// CORS настройки
const corsOptions = {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Логирование всех запросов
app.use(logRequest);

// Маршруты с rate limiting для аутентификации
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/requests', requestRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// Обработка ошибок
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера'
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут не найден'
  });
});

// Запуск сервера
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env['NODE_ENV'] || 'development'}`);
      console.log(`🔒 Security: Helmet, CORS, Rate Limiting enabled`);
      console.log(`📝 Logging: ${process.env['LOG_LEVEL'] || 'info'}`);
      console.log(`🌐 Server accessible at: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  console.log('📴 Disconnected from PostgreSQL');
  process.exit(0);
});

startServer();
