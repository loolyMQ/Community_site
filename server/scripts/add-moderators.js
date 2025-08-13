const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function addModerators() {
  try {
    console.log('🔐 Добавление модераторов в базу данных...\n');
    
    const moderators = [
      {
        email: 'moderator#0001@community.mephi.ru',
        password: '21d6d272a2de700c5f697721b1bdd8a3',
        name: 'Модератор 0001'
      },
      {
        email: 'moderator#0002@community.mephi.ru',
        password: '0e96ed115cba87e4cd5adab3bffaefe4',
        name: 'Модератор 0002'
      },
      {
        email: 'moderator#0003@community.mephi.ru',
        password: 'e65dbf98472a23e0ad8abae1f1c1b9dd',
        name: 'Модератор 0003'
      },
      {
        email: 'moderator#0004@community.mephi.ru',
        password: 'a3106a17f6f81a86bb5078433020f5d3',
        name: 'Модератор 0004'
      }
    ];
    
    for (const moderator of moderators) {
      // Проверяем, существует ли уже модератор с таким email
      const existingUser = await prisma.user.findUnique({
        where: { email: moderator.email }
      });
      
      if (existingUser) {
        console.log(`⚠️  Модератор ${moderator.email} уже существует, пропускаем`);
        continue;
      }
      
      // Хешируем пароль
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(moderator.password, saltRounds);
      
      // Создаем модератора
      const newModerator = await prisma.user.create({
        data: {
          id: `moderator-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
          email: moderator.email,
          password: passwordHash,
          role: 'MODERATOR',
          name: moderator.name,
          telegram: [],
          vk: [],
          website: [],
          other: []
        }
      });
      
      console.log(`✅ Добавлен модератор: ${moderator.email}`);
    }
    
    console.log('\n📊 Проверяем всех модераторов в базе данных...');
    const allModerators = await prisma.user.findMany({
      where: { role: 'MODERATOR' },
      select: { email: true, name: true, createdAt: true }
    });
    
    console.log(`\n📋 Всего модераторов в базе: ${allModerators.length}`);
    allModerators.forEach((mod, index) => {
      console.log(`${index + 1}. ${mod.email} (${mod.name}) - создан: ${mod.createdAt.toLocaleDateString()}`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка при добавлении модераторов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addModerators();
