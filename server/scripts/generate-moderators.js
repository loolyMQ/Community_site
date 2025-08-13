const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function generateModerators() {
  try {
    console.log('🔐 Генерация учетных данных модераторов...\n');
    
    const moderators = [];
    
    for (let i = 1; i <= 4; i++) {
      const email = `moderator#${String(i).padStart(4, '0')}@community.mephi.ru`;
      const password = crypto.randomBytes(16).toString('hex');
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      moderators.push({
        email,
        password,
        passwordHash,
        role: 'MODERATOR'
      });
    }
    
    console.log('📝 Учетные данные модераторов:\n');
    console.log('=== МОДЕРАТОРЫ ===');
    
    moderators.forEach((mod, index) => {
      console.log(`\n--- Модератор ${index + 1} ---`);
      console.log(`Email: ${mod.email}`);
      console.log(`Пароль: ${mod.password}`);
      console.log(`Роль: ${mod.role}`);
    });
    
    console.log('\n📋 SQL для добавления в базу данных:');
    console.log('\n-- Добавление модераторов в таблицу User');
    moderators.forEach((mod) => {
      console.log(`INSERT INTO "User" (id, email, password_hash, role, name, "createdAt", "updatedAt") VALUES ('moderator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}', '${mod.email}', '${mod.passwordHash}', 'MODERATOR', 'Модератор ${mod.email.split('#')[1].split('@')[0]}', NOW(), NOW());`);
    });
    
    console.log('\n⚠️  ВАЖНО:');
    console.log('1. Сохраните пароли в надежном месте!');
    console.log('2. Добавьте модераторов в базу данных через Prisma Studio или SQL');
    console.log('3. Никогда не коммитьте пароли в git!');
    console.log('4. Используйте эти учетные данные только для тестирования');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

generateModerators();
