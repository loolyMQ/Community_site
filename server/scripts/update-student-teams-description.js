const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function updateStudentTeamsDescription() {
  try {
    console.log('🔄 Обновляем описание категории "Студенческие отряды"...');

    // Находим категорию
    const category = await prisma.category.findFirst({
      where: {
        name: 'Студенческие отряды'
      }
    });

    if (!category) {
      console.log('❌ Категория "Студенческие отряды" не найдена');
      return;
    }

    // Обновляем описание
    const updatedCategory = await prisma.category.update({
      where: {
        id: category.id
      },
      data: {
        description: ''
      }
    });

    console.log(`✅ Описание категории "Студенческие отряды" обновлено!`);
    console.log(`📊 ID категории: ${updatedCategory.id}`);
    console.log(`📝 Новое описание: "${updatedCategory.description}"`);

  } catch (error) {
    console.error('❌ Ошибка при обновлении категории:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateStudentTeamsDescription();
