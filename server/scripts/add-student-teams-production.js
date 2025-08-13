const { PrismaClient } = require('../src/generated/prisma');

// Для продакшна используем переменные окружения
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://artemvedernikov:password@localhost:5432/communities'
    }
  }
});

async function addStudentTeamsCategoryProduction() {
  try {
    console.log('🚀 Добавляем категорию "Студенческие отряды" в продакшн...');

    // Проверяем, существует ли уже такая категория
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: 'Студенческие отряды'
      }
    });

    if (existingCategory) {
      console.log('⚠️ Категория "Студенческие отряды" уже существует в продакшне');
      console.log(`📊 ID категории: ${existingCategory.id}`);
      return;
    }

    // Создаем новую категорию
    const newCategory = await prisma.category.create({
      data: {
        name: 'Студенческие отряды',
        description: '',
        icon: '🚀',
        color: '#E74C3C',
        sortOrder: 11,
        isActive: true
      }
    });

    console.log(`✅ Категория "Студенческие отряды" успешно создана в продакшне!`);
    console.log(`📊 ID категории: ${newCategory.id}`);
    console.log(`🎨 Цвет: ${newCategory.color}`);
    console.log(`📝 Описание: "${newCategory.description}"`);

  } catch (error) {
    console.error('❌ Ошибка при создании категории в продакшне:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addStudentTeamsCategoryProduction();
