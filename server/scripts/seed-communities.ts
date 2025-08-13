import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CommunityData {
  category: string;
  name: string;
  description: string;
  leaderContacts: string;
  socialLinks: string;
  comments: string;
}

async function seedCommunities() {
  try {
    console.log('🌱 Начинаем загрузку данных о сообществах...');

    // Читаем CSV файл
    const csvPath = path.join(__dirname, '../../communities_data.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Парсим CSV
    const lines = csvContent.split('\n').slice(1); // Пропускаем заголовок
    const communities: CommunityData[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Простой парсинг CSV (можно улучшить)
      const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
      
      if (columns.length >= 6) {
        communities.push({
          category: columns[0],
          name: columns[1],
          description: columns[2],
          leaderContacts: columns[3],
          socialLinks: columns[4],
          comments: columns[5]
        });
      }
    }

    console.log(`📊 Найдено ${communities.length} сообществ`);

    // Создаем категории
    const categories = [...new Set(communities.map(c => c.category))];
    const categoryMap = new Map();

    for (const categoryName of categories) {
      if (!categoryName || categoryName === '?') continue;
      
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: {
          name: categoryName,
          description: `Категория: ${categoryName}`,
          isActive: true,
          sortOrder: 0
        }
      });
      
      categoryMap.set(categoryName, category.id);
      console.log(`✅ Создана категория: ${categoryName}`);
    }

    // Создаем сообщества
    for (const communityData of communities) {
      if (!communityData.name || communityData.name === '?') continue;

      // Создаем лидера (если есть контакты)
      let leaderId = null;
      if (communityData.leaderContacts && communityData.leaderContacts !== '?') {
        const leader = await prisma.user.upsert({
          where: { email: `leader_${communityData.name.toLowerCase().replace(/\s+/g, '_')}@mephi.local` },
          update: {},
          create: {
            name: `Руководитель ${communityData.name}`,
            email: `leader_${communityData.name.toLowerCase().replace(/\s+/g, '_')}@mephi.local`,
            password: 'temp_password_123',
            role: 'STUDENT',
            isActive: true
          }
        });
        leaderId = leader.id;
      }

      // Создаем сообщество
      const community = await prisma.community.upsert({
        where: { name: communityData.name },
        update: {},
        create: {
          name: communityData.name,
          description: communityData.description || 'Описание отсутствует',
          shortDescription: (communityData.description || 'Описание отсутствует').substring(0, 100) + '...',
          leaderId,
          isActive: true
        }
      });

      // Связываем с категориями
      if (communityData.category && categoryMap.has(communityData.category)) {
        await prisma.communityCategory.upsert({
          where: {
            communityId_categoryId: {
              communityId: community.id,
              categoryId: categoryMap.get(communityData.category)
            }
          },
          update: {},
          create: {
            communityId: community.id,
            categoryId: categoryMap.get(communityData.category),
            isMain: true
          }
        });
      }

      console.log(`✅ Создано сообщество: ${communityData.name}`);
    }

    console.log('🎉 Загрузка данных завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при загрузке данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCommunities();
