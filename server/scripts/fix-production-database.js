const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:gmQCecJtIUrawaRnzfPFGtvCLcuHgfUH@metro.proxy.rlwy.net:17580/railway'
    }
  }
});

async function fixProductionDatabase() {
  try {
    console.log('🔧 Исправляем продакшн базу данных...');
    
    // Проверяем текущую схему
    console.log('📊 Проверяем текущую схему...');
    
    // Обновляем все записи с пустыми массивами в поле phone
    console.log('🔄 Обновляем поле phone...');
    const phoneResult = await prisma.community.updateMany({
      where: {
        OR: [
          { phone: null },
          { phone: [] }
        ]
      },
      data: {
        phone: []
      }
    });
    console.log(`✅ Обновлено записей phone: ${phoneResult.count}`);
    
    // Обновляем все записи с пустыми массивами в поле telegram
    console.log('🔄 Обновляем поле telegram...');
    const telegramResult = await prisma.community.updateMany({
      where: {
        OR: [
          { telegram: null },
          { telegram: [] }
        ]
      },
      data: {
        telegram: []
      }
    });
    console.log(`✅ Обновлено записей telegram: ${telegramResult.count}`);
    
    // Обновляем все записи с пустыми массивами в поле vk
    console.log('🔄 Обновляем поле vk...');
    const vkResult = await prisma.community.updateMany({
      where: {
        OR: [
          { vk: null },
          { vk: [] }
        ]
      },
      data: {
        vk: []
      }
    });
    console.log(`✅ Обновлено записей vk: ${vkResult.count}`);
    
    // Обновляем все записи с пустыми массивами в поле website
    console.log('🔄 Обновляем поле website...');
    const websiteResult = await prisma.community.updateMany({
      where: {
        OR: [
          { website: null },
          { website: [] }
        ]
      },
      data: {
        website: []
      }
    });
    console.log(`✅ Обновлено записей website: ${websiteResult.count}`);
    
    // Проверяем результат
    console.log('📊 Проверяем результат...');
    const communities = await prisma.community.findMany({
      include: {
        categories: {
          include: {
            category: true
          }
        },
        leader: true
      }
    });
    
    console.log(`✅ Всего сообществ в продакшне: ${communities.length}`);
    communities.forEach(c => {
      console.log(`  - ${c.name} (ID: ${c.id})`);
      console.log(`    Категории: ${c.categories.length}`);
      console.log(`    Контакты: telegram=${c.telegram?.length || 0}, vk=${c.vk?.length || 0}, website=${c.website?.length || 0}, phone=${c.phone?.length || 0}`);
    });
    
    console.log('🎉 Продакшн база данных успешно исправлена!');
    
  } catch (error) {
    console.error('❌ Ошибка при исправлении продакшн базы данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProductionDatabase();
