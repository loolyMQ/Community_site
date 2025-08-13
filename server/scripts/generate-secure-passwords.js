const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Генерируем сильные пароли
const generateSecurePassword = () => {
  const length = 16;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Гарантируем наличие всех типов символов
  password += 'A'; // Заглавная буква
  password += 'a'; // Строчная буква
  password += '1'; // Цифра
  password += '!'; // Специальный символ
  
  // Заполняем остальное случайными символами
  for (let i = 4; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Перемешиваем пароль
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Генерируем JWT секреты
const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('base64');
};

// Генерируем безопасные пароли и хеши
const generateCredentials = async () => {
  console.log('🔐 Генерация безопасных учетных данных...\n');
  
  // Генерируем пароли
  const adminPassword = generateSecurePassword();
  const moderatorPassword = generateSecurePassword();
  
  // Хешируем пароли с 14 раундами
  const adminHash = await bcrypt.hash(adminPassword, 14);
  const moderatorHash = await bcrypt.hash(moderatorPassword, 14);
  
  // Генерируем JWT секреты
  const jwtSecret = generateJWTSecret();
  const jwtRefreshSecret = generateJWTSecret();
  const sessionSecret = generateJWTSecret();
  
  console.log('📋 СГЕНЕРИРОВАННЫЕ УЧЕТНЫЕ ДАННЫЕ:');
  console.log('=====================================');
  console.log('\n👤 АДМИНИСТРАТОР:');
  console.log(`Email: admin@university.edu`);
  console.log(`Пароль: ${adminPassword}`);
  console.log(`Хеш: ${adminHash}`);
  
  console.log('\n👤 МОДЕРАТОР:');
  console.log(`Email: moderator@university.edu`);
  console.log(`Пароль: ${moderatorPassword}`);
  console.log(`Хеш: ${moderatorHash}`);
  
  console.log('\n🔑 JWT СЕКРЕТЫ:');
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
  console.log(`SESSION_SECRET=${sessionSecret}`);
  
  console.log('\n📝 ОБНОВЛЕННЫЕ ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ:');
  console.log('=====================================');
  console.log(`# Admin Credentials (хэши bcrypt)`);
  console.log(`ADMIN_EMAIL=admin@university.edu`);
  console.log(`ADMIN_PASSWORD_HASH=${adminHash}`);
  console.log(`MODERATOR_EMAIL=moderator@university.edu`);
  console.log(`MODERATOR_PASSWORD_HASH=${moderatorHash}`);
  console.log(`\n# JWT Configuration`);
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
  console.log(`SESSION_SECRET=${sessionSecret}`);
  
  console.log('\n⚠️  ВНИМАНИЕ:');
  console.log('1. Сохраните пароли в безопасном месте');
  console.log('2. Обновите .env.local файл с новыми хешами');
  console.log('3. Никогда не коммитьте пароли в git');
  console.log('4. Используйте разные пароли для продакшена');
  
  return {
    adminPassword,
    moderatorPassword,
    adminHash,
    moderatorHash,
    jwtSecret,
    jwtRefreshSecret,
    sessionSecret
  };
};

// Запускаем генерацию
generateCredentials().catch(console.error);
