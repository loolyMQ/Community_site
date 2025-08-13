const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function fixArchivedReviews() {
  try {
    console.log('🔧 Исправляем архивные отзывы...');
    
    // Находим все одобренные отзывы, которые находятся в архиве
    const archivedReviews = await prisma.review.findMany({
      where: {
        isVerified: true,
        isPublished: true,
        isActive: true,
        isArchived: true
      }
    });
    
    console.log(`📝 Найдено ${archivedReviews.length} архивных отзывов`);
    
    if (archivedReviews.length > 0) {
      // Убираем флаг архива с одобренных отзывов
      const updatedReviews = await prisma.review.updateMany({
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
      
      console.log(`✅ Исправлено ${updatedReviews.count} отзывов`);
    }
    
    // Проверяем результат
    const activeReviews = await prisma.review.findMany({
      where: {
        isVerified: true,
        isPublished: true,
        isActive: true,
        isArchived: false
      }
    });
    
    console.log(`📊 Теперь активных отзывов: ${activeReviews.length}`);
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixArchivedReviews();
