const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixReviews() {
  try {
    console.log('🔧 Исправляем отзывы...');
    
    // Убираем флаг архива с одобренных отзывов
    const result = await prisma.review.updateMany({
      where: {
        isVerified: true,
        isPublished: true,
        isActive: true,
        isArchived: true
      },
      data: {
        isArchived: false
      }
    });
    
    console.log(`✅ Исправлено ${result.count} отзывов`);
    
    // Проверяем результат
    const activeReviews = await prisma.review.findMany({
      where: {
        isVerified: true,
        isPublished: true,
        isActive: true
      }
    });
    
    console.log(`📊 Активных отзывов: ${activeReviews.length}`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixReviews();
