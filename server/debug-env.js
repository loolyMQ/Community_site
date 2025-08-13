const { config } = require('dotenv');

// Загружаем переменные окружения
config({ path: '.env.local' });

console.log('🔍 Проверка переменных окружения...\n');

console.log('ADMIN_EMAIL:', process.env['ADMIN_EMAIL']);
console.log('ADMIN_PASSWORD_HASH:', process.env['ADMIN_PASSWORD_HASH'] ? '✅ Загружен' : '❌ Не загружен');
console.log('JWT_SECRET:', process.env['JWT_SECRET'] ? '✅ Загружен' : '❌ Не загружен');
console.log('JWT_REFRESH_SECRET:', process.env['JWT_REFRESH_SECRET'] ? '✅ Загружен' : '❌ Не загружен');

console.log('\n📝 Первые 20 символов хеша:', process.env['ADMIN_PASSWORD_HASH']?.substring(0, 20));
console.log('📝 Первые 20 символов JWT_SECRET:', process.env['JWT_SECRET']?.substring(0, 20));
