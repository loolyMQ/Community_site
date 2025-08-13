const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function generateSecureAdmin() {
  try {
    console.log('🔐 Генерация безопасных админ учетных данных...\n');
    
    // Генерируем случайный пароль
    const password = crypto.randomBytes(16).toString('hex');
    console.log(`🔑 Сгенерированный пароль: ${password}\n`);
    
    // Генерируем хеш пароля
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Генерируем JWT секреты
    const jwtSecret = crypto.randomBytes(64).toString('hex');
    const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
    
    // Генерируем случайный email
    const adminEmail = `admin_${crypto.randomBytes(8).toString('hex')}@mephi.local`;
    
    console.log('📝 Добавьте следующие переменные в ваш .env файл:\n');
    console.log('=== АДМИН УЧЕТНЫЕ ДАННЫЕ ===');
    console.log(`ADMIN_EMAIL=${adminEmail}`);
    console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
    console.log('');
    console.log('=== JWT СЕКРЕТЫ ===');
    console.log(`JWT_SECRET=${jwtSecret}`);
    console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
    console.log('');
    console.log('=== ДОПОЛНИТЕЛЬНЫЕ НАСТРОЙКИ БЕЗОПАСНОСТИ ===');
    console.log('JWT_EXPIRES_IN=15m');
    console.log('JWT_REFRESH_EXPIRES_IN=7d');
    console.log('MAX_LOGIN_ATTEMPTS=3');
    console.log('LOCKOUT_DURATION=1800000');
    console.log('RATE_LIMIT_MAX_REQUESTS=100');
    console.log('');
    console.log('⚠️  ВАЖНО: Сохраните пароль в надежном месте!');
    console.log('⚠️  ВАЖНО: Никогда не коммитьте .env файл в git!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  }
}

generateSecureAdmin();
