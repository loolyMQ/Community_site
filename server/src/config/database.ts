import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Создаем экземпляр Prisma Client
export const prisma = new PrismaClient({
  log: process.env['NODE_ENV'] === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const connectDatabase = async (): Promise<void> => {
  try {
    // Проверяем подключение к базе данных
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL successfully');
    
    // Обработка событий подключения
    prisma.$on('query', (e: any) => {
      if (process.env['NODE_ENV'] === 'development') {
        console.log('Query: ' + e.query);
        console.log('Params: ' + e.params);
        console.log('Duration: ' + e.duration + 'ms');
      }
    });
    
    
  } catch (error) {
    console.error('❌ Failed to connect to PostgreSQL:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('📴 Disconnected from PostgreSQL');
  } catch (error) {
    console.error('❌ Error disconnecting from PostgreSQL:', error);
  }
};
