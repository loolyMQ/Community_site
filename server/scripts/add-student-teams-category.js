const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function addStudentTeamsCategory() {
  try {
    console.log('🚀 Добавляем категорию "Студенческие отряды"...');

    // Проверяем, существует ли уже такая категория
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: 'Студенческие отряды'
      }
    });

    if (existingCategory) {
      console.log('⚠️ Категория "Студенческие отряды" уже существует');
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

    console.log(`✅ Категория "Студенческие отряды" успешно создана!`);
    console.log(`📊 ID категории: ${newCategory.id}`);
    console.log(`🎨 Цвет: ${newCategory.color}`);
    console.log(`📝 Описание: ${newCategory.description}`);

  } catch (error) {
    console.error('❌ Ошибка при создании категории:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addStudentTeamsCategory();
