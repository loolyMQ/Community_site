const bcrypt = require('bcryptjs');

async function testPassword() {
  const password = '6ba13ccf0e63b4b1fcf4b1e5485803ed';
  const hash = '$2a$12$y10x60/GCOASJxrl4eDJeeAhpv5aeOuI2Knc3Yujd05D464SDuHzm';
  
  console.log('🔍 Проверка пароля...');
  console.log(`Пароль: ${password}`);
  console.log(`Хеш: ${hash}`);
  
  const isValid = await bcrypt.compare(password, hash);
  console.log(`Результат: ${isValid ? '✅ Правильный' : '❌ Неправильный'}`);
  
  // Генерируем новый хеш для сравнения
  const newHash = await bcrypt.hash(password, 12);
  console.log(`Новый хеш: ${newHash}`);
  
  const isValidNew = await bcrypt.compare(password, newHash);
  console.log(`Новый результат: ${isValidNew ? '✅ Правильный' : '❌ Неправильный'}`);
}

testPassword();
