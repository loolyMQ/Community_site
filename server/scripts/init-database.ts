import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('🚀 Начинаем инициализацию базы данных...');

    // 1. Запускаем миграции
    console.log('📊 Запускаем миграции Prisma...');
    try {
      const { execSync } = require('child_process');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Миграции уже применены или ошибка:', error.message);
    }

    // 2. Генерируем Prisma Client
    console.log('🔧 Генерируем Prisma Client...');
    try {
      const { execSync } = require('child_process');
      execSync('npx prisma generate', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Prisma Client уже сгенерирован или ошибка:', error.message);
    }

    // 3. Загружаем данные о сообществах
    // Проверяем, есть ли уже данные
    console.log('🔍 Проверяем существующие данные...');
    const existingCommunities = await prisma.community.count();
    if (existingCommunities > 0) {
      console.log(`✅ В базе уже есть ${existingCommunities} сообществ. Пропускаем загрузку.`);
      return;
    }

    console.log('🌱 Загружаем данные о сообществах...');
    
    // Читаем CSV файл
    const csvPath = path.join(__dirname, '../../communities_data.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    // Парсим CSV
    const lines = csvContent.split('\n').slice(1); // Пропускаем заголовок
    const communities = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Простой парсинг CSV
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
      if (!categoryName || categoryName === '?' || categoryName === '(только) Секция') continue;
      
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
      if (communityData.leaderContacts && communityData.leaderContacts !== '?' && communityData.leaderContacts !== 'ОЛЕГ СДЕЛАЕТ, МЫ В НЕГО ВЕРИМ ') {
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

    console.log('🎉 База данных инициализирована успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при инициализации базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();
