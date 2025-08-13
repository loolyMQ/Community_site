import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedReviews() {
  try {
    console.log('🌱 Начинаем создание тестовых данных...');

    // Очищаем существующие данные
    await prisma.review.deleteMany({});
    await prisma.community.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('🗑️ Существующие данные удалены');

    // Создаем тестовых пользователей
    const users = await Promise.all([
      prisma.user.create({
        data: {
          email: 'user1@test.com',
          password: 'hashedpassword',
          name: 'Алексей Петров',
          role: 'STUDENT'
        }
      }),
      prisma.user.create({
        data: {
          email: 'user2@test.com',
          password: 'hashedpassword',
          name: 'Мария Сидорова',
          role: 'STUDENT'
        }
      }),
      prisma.user.create({
        data: {
          email: 'user3@test.com',
          password: 'hashedpassword',
          name: 'Дмитрий Иванов',
          role: 'STUDENT'
        }
      })
    ]);

    console.log(`👥 Создано ${users.length} пользователей`);

    // Создаем тестовые сообщества
    const communities = await Promise.all([
      prisma.community.create({
        data: {
          name: 'Студенческое сообщество',
          description: 'Общее сообщество для всех студентов',
          shortDescription: 'Место для общения и развития',
          leaderId: users[0].id,
          categoryIds: ['1', '2']
        }
      }),
      prisma.community.create({
        data: {
          name: 'Сообщество программистов',
          description: 'Сообщество для разработчиков и IT-специалистов',
          shortDescription: 'Программирование и технологии',
          leaderId: users[1].id,
          categoryIds: ['3']
        }
      }),
      prisma.community.create({
        data: {
          name: 'Сообщество дизайнеров',
          description: 'Креативное сообщество для дизайнеров',
          shortDescription: 'Дизайн и творчество',
          leaderId: users[2].id,
          categoryIds: ['4']
        }
      }),
      prisma.community.create({
        data: {
          name: 'Сообщество предпринимателей',
          description: 'Сообщество для бизнес-инициатив',
          shortDescription: 'Предпринимательство и стартапы',
          leaderId: users[0].id,
          categoryIds: ['5']
        }
      }),
      prisma.community.create({
        data: {
          name: 'Научное сообщество',
          description: 'Сообщество для научных исследований',
          shortDescription: 'Наука и исследования',
          leaderId: users[1].id,
          categoryIds: ['6']
        }
      })
    ]);

    console.log(`🏢 Создано ${communities.length} сообществ`);

    // Тестовые отзывы
    const testReviews = [
      {
        content: 'Отличное сообщество! Здесь можно найти единомышленников и развиваться в интересующих направлениях. Модераторы очень отзывчивые и всегда готовы помочь.',
        rating: 5,
        isAnonymous: false,
        isPublished: true,
        communityId: communities[0].id,
        userId: users[0].id
      },
      {
        content: 'Хорошая атмосфера, но иногда не хватает активности. В целом доволен участием в сообществе.',
        rating: 4,
        isAnonymous: false,
        isPublished: true,
        communityId: communities[0].id,
        userId: users[1].id
      },
      {
        content: 'Мне очень нравится это сообщество! Здесь много интересных людей и полезных мероприятий.',
        rating: 5,
        isAnonymous: true,
        isPublished: true,
        communityId: communities[0].id
      },
      {
        content: 'Сообщество для программистов - просто супер! Много полезной информации и интересных проектов.',
        rating: 5,
        isAnonymous: false,
        isPublished: true,
        communityId: communities[1].id,
        userId: users[0].id
      },
      {
        content: 'Хорошо организованное сообщество разработчиков. Регулярные митапы и хакатоны.',
        rating: 4,
        isAnonymous: false,
        isPublished: true,
        communityId: communities[1].id,
        userId: users[1].id
      },
      {
        content: 'Отличное место для изучения новых технологий и общения с коллегами.',
        rating: 5,
        isAnonymous: true,
        isPublished: true,
        communityId: communities[1].id
      },
      {
        content: 'Сообщество дизайнеров - креативная атмосфера и много вдохновения!',
        rating: 5,
        isAnonymous: false,
        isPublished: true,
        communityId: communities[2].id,
        userId: users[0].id
      },
      {
        content: 'Интересные воркшопы и мастер-классы. Рекомендую всем дизайнерам.',
        rating: 4,
        isAnonymous: false,
        isPublished: true,
        communityId: communities[2].id,
        userId: users[1].id
      },
      {
        content: 'Хорошее сообщество, но хотелось бы больше практических занятий.',
        rating: 3,
        isAnonymous: true,
        isPublished: true,
        communityId: communities[2].id
      },
      {
        content: 'Сообщество предпринимателей - много полезных контактов и идей для бизнеса.',
        rating: 5,
        isAnonymous: false,
        isPublished: true,
        communityId: communities[3].id,
        userId: users[0].id
      },
      {
        content: 'Отличная платформа для нетворкинга и обмена опытом.',
        rating: 4,
        isAnonymous: false,
        isPublished: true,
        communityId: communities[3].id,
        userId: users[1].id
      },
      {
        content: 'Много интересных спикеров и полезных встреч.',
        rating: 5,
        isAnonymous: true,
        isPublished: true,
        communityId: communities[3].id
      },
      {
        content: 'Сообщество ученых - высокий уровень дискуссий и исследований.',
        rating: 5,
        isAnonymous: false,
        isPublished: true,
        communityId: communities[4].id,
        userId: users[0].id
      },
      {
        content: 'Интересные научные проекты и коллаборации.',
        rating: 4,
        isAnonymous: false,
        isPublished: true,
        communityId: communities[4].id,
        userId: users[1].id
      },
      {
        content: 'Хорошая атмосфера для научного общения.',
        rating: 4,
        isAnonymous: true,
        isPublished: true,
        communityId: communities[4].id
      }
    ];

    // Добавляем тестовые отзывы
    for (const reviewData of testReviews) {
      const reviewCreateData: any = {
        content: reviewData.content,
        rating: reviewData.rating,
        isAnonymous: reviewData.isAnonymous,
        isPublished: reviewData.isPublished,
        communityId: reviewData.communityId
      };

      if (!reviewData.isAnonymous && reviewData.userId) {
        reviewCreateData.userId = reviewData.userId;
      }

      await prisma.review.create({
        data: reviewCreateData
      });
    }

    console.log(`✅ Добавлено ${testReviews.length} тестовых отзывов`);

    // Выводим статистику
    const totalReviews = await prisma.review.count();
    const publishedReviews = await prisma.review.count({
      where: { isPublished: true }
    });
    const anonymousReviews = await prisma.review.count({
      where: { isAnonymous: true }
    });

    console.log('\n📊 Статистика отзывов:');
    console.log(`📝 Всего отзывов: ${totalReviews}`);
    console.log(`✅ Опубликовано: ${publishedReviews}`);
    console.log(`👤 Анонимных: ${anonymousReviews}`);

    // Статистика по рейтингам
    const ratingStats = await prisma.review.groupBy({
      by: ['rating'],
      _count: {
        rating: true
      }
    });

    console.log('\n⭐ Статистика по рейтингам:');
    ratingStats.forEach(stat => {
      const stars = '⭐'.repeat(stat.rating);
      console.log(`${stars} (${stat.rating}): ${stat._count.rating} отзывов`);
    });

    // Статистика по сообществам
    const communityStats = await prisma.review.groupBy({
      by: ['communityId'],
      _count: {
        communityId: true
      },
      _avg: {
        rating: true
      }
    });

    console.log('\n🏢 Статистика по сообществам:');
    for (const stat of communityStats) {
      const community = communities.find(c => c.id === stat.communityId);
      const communityName = community ? community.name : `Сообщество ${stat.communityId}`;
      console.log(`${communityName}: ${stat._count.communityId} отзывов, средний рейтинг: ${stat._avg.rating?.toFixed(1)}⭐`);
    }

    console.log('\n🎉 Тестовые данные успешно созданы!');

  } catch (error) {
    console.error('❌ Ошибка при создании тестовых данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedReviews(); 