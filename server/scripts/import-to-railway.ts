import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importToRailway() {
  try {
    console.log('🚀 Importing data to Railway PostgreSQL...');

    // Читаем исправленные данные
    const dataPath = path.join(__dirname, '../data-export-fixed.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log(`📊 Data to import:`);
    console.log(`   - Users: ${data.users.length}`);
    console.log(`   - Categories: ${data.categories.length}`);
    console.log(`   - Communities: ${data.communities.length}`);
    console.log(`   - Reviews: ${data.reviews.length}`);
    console.log(`   - Community Categories: ${data.communityCategories.length}`);

    // Импортируем данные в правильном порядке (с учетом зависимостей)
    
    // 1. Сначала категории
    console.log('\n📂 Importing categories...');
    for (const category of data.categories) {
      await prisma.category.upsert({
        where: { id: category.id },
        update: category,
        create: category
      });
    }
    console.log(`✅ Imported ${data.categories.length} categories`);

    // 2. Затем пользователей
    console.log('\n👥 Importing users...');
    for (const user of data.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      });
    }
    console.log(`✅ Imported ${data.users.length} users`);

    // 3. Сообщества
    console.log('\n🏢 Importing communities...');
    for (const community of data.communities) {
      await prisma.community.upsert({
        where: { id: community.id },
        update: community,
        create: community
      });
    }
    console.log(`✅ Imported ${data.communities.length} communities`);

    // 4. Связи сообществ с категориями
    console.log('\n🔗 Importing community categories...');
    for (const communityCategory of data.communityCategories) {
      await prisma.communityCategory.upsert({
        where: { id: communityCategory.id },
        update: communityCategory,
        create: communityCategory
      });
    }
    console.log(`✅ Imported ${data.communityCategories.length} community categories`);

    // 5. Отзывы
    console.log('\n⭐ Importing reviews...');
    for (const review of data.reviews) {
      await prisma.review.upsert({
        where: { id: review.id },
        update: review,
        create: review
      });
    }
    console.log(`✅ Imported ${data.reviews.length} reviews`);

    // 6. Остальные данные
    if (data.userActivities && data.userActivities.length > 0) {
      console.log('\n📈 Importing user activities...');
      for (const activity of data.userActivities) {
        await prisma.userActivity.upsert({
          where: { id: activity.id },
          update: activity,
          create: activity
        });
      }
      console.log(`✅ Imported ${data.userActivities.length} user activities`);
    }

    if (data.communityMembers && data.communityMembers.length > 0) {
      console.log('\n👥 Importing community members...');
      for (const member of data.communityMembers) {
        await prisma.communityMember.upsert({
          where: { id: member.id },
          update: member,
          create: member
        });
      }
      console.log(`✅ Imported ${data.communityMembers.length} community members`);
    }

    if (data.communityRelationships && data.communityRelationships.length > 0) {
      console.log('\n🔗 Importing community relationships...');
      for (const relationship of data.communityRelationships) {
        await prisma.communityRelationship.upsert({
          where: { id: relationship.id },
          update: relationship,
          create: relationship
        });
      }
      console.log(`✅ Imported ${data.communityRelationships.length} community relationships`);
    }

    console.log('\n🎉 Data import completed successfully!');
    console.log('\n🔑 Admin credentials:');
    console.log('   Check credentials.txt for login details');

  } catch (error) {
    console.error('❌ Error importing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importToRailway();
