const { execSync } = require('child_process');

async function applyProductionMigration() {
  try {
    console.log('🚀 Применяем миграцию к продакшн базе данных...');
    
    // Устанавливаем переменную окружения для продакшн базы
    process.env.DATABASE_URL = 'postgresql://postgres:gmQCecJtIUrawaRnzfPFGtvCLcuHgfUH@metro.proxy.rlwy.net:17580/railway';
    
    console.log('📊 Генерируем Prisma клиент...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('🔄 Применяем миграции...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('✅ Миграция успешно применена к продакшн базе данных!');
    
  } catch (error) {
    console.error('❌ Ошибка при применении миграции:', error);
  }
}

applyProductionMigration();
