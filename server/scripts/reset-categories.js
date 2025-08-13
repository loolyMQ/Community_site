const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🗑️ Начинаем очистку базы данных...');

    // Удаляем все связи между сообществами
    console.log('Удаляем связи между сообществами...');
    await prisma.communityRelationship.deleteMany({});
    console.log('✅ Связи удалены');

    // Удаляем все связи сообществ с категориями
    console.log('Удаляем связи сообществ с категориями...');
    await prisma.communityCategory.deleteMany({});
    console.log('✅ Связи с категориями удалены');

    // Удаляем все отзывы
    console.log('Удаляем отзывы...');
    await prisma.review.deleteMany({});
    console.log('✅ Отзывы удалены');

    // Удаляем все сообщества (сначала, чтобы не было проблем с внешними ключами)
    console.log('Удаляем сообщества...');
    await prisma.community.deleteMany({});
    console.log('✅ Сообщества удалены');

    // Удаляем всех пользователей (кроме админов)
    console.log('Удаляем пользователей...');
    await prisma.user.deleteMany({
      where: {
        role: {
          not: 'ADMIN'
        }
      }
    });
    console.log('✅ Пользователи удалены');

    // Удаляем все категории
    console.log('Удаляем категории...');
    await prisma.category.deleteMany({});
    console.log('✅ Категории удалены');

    console.log('🎉 База данных очищена!');

    // Создаем новые категории
    console.log('\n📝 Создаем новые категории...');

    const newCategories = [
      {
        name: 'Сборные',
        description: 'Спортивные сборные команды университета',
        icon: '🏆',
        color: '#FF6B6B',
        sortOrder: 1
      },
      {
        name: 'Секции',
        description: 'Специализированные секции и кружки',
        icon: '🔧',
        color: '#4ECDC4',
        sortOrder: 2
      },
      {
        name: 'Проект-события',
        description: 'Организация мероприятий и проектов',
        icon: '🎪',
        color: '#45B7D1',
        sortOrder: 3
      },
      {
        name: 'ОСО',
        description: 'Орган студенческого самоуправления',
        icon: '🏛️',
        color: '#96CEB4',
        sortOrder: 4
      },
      {
        name: 'Общественная деятельность',
        description: 'Общественные инициативы и волонтерство',
        icon: '🤝',
        color: '#FFEAA7',
        sortOrder: 5
      },
      {
        name: 'Наука',
        description: 'Научно-исследовательская деятельность',
        icon: '🔬',
        color: '#DDA0DD',
        sortOrder: 6
      },
      {
        name: 'Медиа',
        description: 'Средства массовой информации и коммуникации',
        icon: '📺',
        color: '#98D8C8',
        sortOrder: 7
      },
      {
        name: 'Карьера',
        description: 'Профессиональное развитие и трудоустройство',
        icon: '💼',
        color: '#F7DC6F',
        sortOrder: 8
      },
      {
        name: 'Искусство',
        description: 'Творческие направления и культурная деятельность',
        icon: '🎨',
        color: '#BB8FCE',
        sortOrder: 9
      },
      {
        name: 'Досуг',
        description: 'Развлекательные и досуговые активности',
        icon: '🎮',
        color: '#85C1E9',
        sortOrder: 10
      }
    ];

    for (const category of newCategories) {
      const createdCategory = await prisma.category.create({
        data: {
          name: category.name,
          description: category.description,
          icon: category.icon,
          color: category.color,
          sortOrder: category.sortOrder,
          isActive: true
        }
      });
      console.log(`✅ Создана категория: ${category.name} (ID: ${createdCategory.id})`);
    }

    console.log('\n🎉 Все категории созданы успешно!');
    console.log(`📊 Всего создано категорий: ${newCategories.length}`);

  } catch (error) {
    console.error('❌ Ошибка при сбросе базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase(); 