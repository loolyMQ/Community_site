import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('📊 Exporting data from local database...');

    // Экспортируем все данные
    const data = {
      users: await prisma.user.findMany(),
      categories: await prisma.category.findMany(),
      communities: await prisma.community.findMany(),
      reviews: await prisma.review.findMany(),
      userActivities: await prisma.userActivity.findMany(),
      communityMembers: await prisma.communityMember.findMany(),
      communityRelationships: await prisma.communityRelationship.findMany(),
      communityCategories: await prisma.communityCategory.findMany(),
      joinRequests: await prisma.joinRequest.findMany(),
      collaborationRequests: await prisma.collaborationRequest.findMany(),
      news: await prisma.news.findMany(),
      notifications: await prisma.notification.findMany(),
      communityActivities: await prisma.communityActivity.findMany(),
      systemStats: await prisma.systemStats.findMany(),
    };

    // Сохраняем в файл
    const fs = require('fs');
    const path = require('path');
    
    const exportPath = path.join(__dirname, '../data-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));
    
    console.log(`✅ Data exported to: ${exportPath}`);
    console.log(`📈 Exported:`);
    console.log(`   - Users: ${data.users.length}`);
    console.log(`   - Categories: ${data.categories.length}`);
    console.log(`   - Communities: ${data.communities.length}`);
    console.log(`   - Reviews: ${data.reviews.length}`);
    console.log(`   - User Activities: ${data.userActivities.length}`);
    console.log(`   - Community Members: ${data.communityMembers.length}`);
    console.log(`   - Community Relationships: ${data.communityRelationships.length}`);
    console.log(`   - Community Categories: ${data.communityCategories.length}`);
    console.log(`   - Join Requests: ${data.joinRequests.length}`);
    console.log(`   - Collaboration Requests: ${data.collaborationRequests.length}`);
    console.log(`   - News: ${data.news.length}`);
    console.log(`   - Notifications: ${data.notifications.length}`);
    console.log(`   - Community Activities: ${data.communityActivities.length}`);
    console.log(`   - System Stats: ${data.systemStats.length}`);

  } catch (error) {
    console.error('❌ Error exporting data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
