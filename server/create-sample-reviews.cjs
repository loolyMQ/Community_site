const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const sampleReviews = [
  {
    rating: 5,
    title: "Отличное сообщество!",
    content: "Очень дружелюбная атмосфера, интересные мероприятия. Рекомендую всем!"
  },
  {
    rating: 4,
    title: "Хорошая организация",
    content: "Мероприятия проводятся регулярно, есть чему поучиться. Иногда бывают задержки."
  },
  {
    rating: 5,
    title: "Лучшее сообщество в МИФИ",
    content: "Активные участники, интересные проекты. Очень доволен участием!"
  },
  {
    rating: 4,
    title: "Рекомендую",
    content: "Хорошая возможность для развития навыков и знакомств с единомышленниками."
  },
  {
    rating: 5,
    title: "Отличные возможности",
    content: "Много интересных проектов, дружный коллектив. Спасибо за опыт!"
  }
];

const sampleComments = [
  "Отличная атмосфера для развития!",
  "Интересные мероприятия и проекты",
  "Дружный коллектив, всегда готовы помочь",
  "Много возможностей для самореализации",
  "Профессиональный подход к организации",
  "Рекомендую всем студентам МИФИ",
  "Отличная платформа для networking",
  "Интересные лекции и мастер-классы",
  "Активная студенческая жизнь",
  "Возможность проявить себя в разных направлениях"
];

async function createSampleReviews() {
  try {
    console.log('Creating sample reviews...');
    
    // Get all communities
    const communities = await prisma.community.findMany({
      take: 50 // Limit to first 50 communities
    });
    
    // Get or create a test user
    let testUser = await prisma.user.findFirst({
      where: { email: 'student@mephi.ru' }
    });
    
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'student@mephi.ru',
          password: '$2b$10$dummy.hash.for.test.user',
          name: 'Тестовый студент',
          role: 'STUDENT',
          isVerified: true
        }
      });
    }
    
    let reviewCount = 0;
    
    for (const community of communities) {
      // Create 1-3 reviews per community
      const numReviews = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numReviews; i++) {
        const reviewData = sampleReviews[Math.floor(Math.random() * sampleReviews.length)];
        const comment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        
        try {
          await prisma.review.create({
            data: {
              userId: testUser.id,
              communityId: community.id,
              rating: reviewData.rating,
              title: reviewData.title,
              content: reviewData.content + ' ' + comment,
              isVerified: true,
              isPublished: true,
              isActive: true
            }
          });
          reviewCount++;
        } catch (error) {
          // Review might already exist for this user-community pair
          console.log(`Skipping duplicate review for ${community.name}`);
        }
      }
    }
    
    console.log(`Created ${reviewCount} sample reviews`);
    
    // Update community ratings
    console.log('Updating community ratings...');
    
    for (const community of communities) {
      const reviews = await prisma.review.findMany({
        where: { 
          communityId: community.id,
          isPublished: true,
          isActive: true
        }
      });
      
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        
        await prisma.community.update({
          where: { id: community.id },
          data: {
            currentMembers: Math.max(community.currentMembers, reviews.length * 3)
          }
        });
      }
    }
    
    console.log('Sample data creation completed!');
    
  } catch (error) {
    console.error('Error creating sample reviews:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSampleReviews(); 