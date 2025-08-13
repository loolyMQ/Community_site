import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

// Функция для генерации сложного пароля
function generateComplexPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  // Генерируем пароль длиной 20 символов
  for (let i = 0; i < 20; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return password;
}

async function updatePasswords() {
  try {
    console.log('🔐 Updating admin and moderator passwords...');

    // Читаем экспортированные данные
    const dataPath = path.join(__dirname, '../data-export.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Обновляем только админа и модераторов, остальных удаляем
    let updatedCount = 0;
    const filteredUsers: any[] = [];
    const credentials: { email: string; password: string; role: string }[] = [];
    
    for (const user of data.users) {
      if (user.role === 'ADMIN') {
        const password = generateComplexPassword();
        const hashedPassword = await bcrypt.hash(password, 12);
        
        console.log(`👑 Updating admin: ${user.name} (${user.email})`);
        user.password = hashedPassword;
        user.email = 'admin@community-site.ru';
        user.name = 'Системный администратор';
        filteredUsers.push(user);
        credentials.push({ email: user.email, password, role: 'Admin' });
        updatedCount++;
      } else if (user.role === 'MODERATOR') {
        const password = generateComplexPassword();
        const hashedPassword = await bcrypt.hash(password, 12);
        
        console.log(`🛡️ Updating moderator: ${user.name} (${user.email})`);
        user.password = hashedPassword;
        
        // Обновляем логины модераторов
        if (user.name.includes('0001')) {
          user.email = 'moderator1@community-site.ru';
          user.name = 'Модератор 1';
        } else if (user.name.includes('0002')) {
          user.email = 'moderator2@community-site.ru';
          user.name = 'Модератор 2';
        } else if (user.name.includes('0003')) {
          user.email = 'moderator3@community-site.ru';
          user.name = 'Модератор 3';
        } else if (user.name.includes('0004')) {
          user.email = 'moderator4@community-site.ru';
          user.name = 'Модератор 4';
        }
        
        filteredUsers.push(user);
        credentials.push({ email: user.email, password, role: 'Moderator' });
        updatedCount++;
      }
      // LEADER пользователей удаляем
    }

    // Заменяем пользователей на отфильтрованный список
    data.users = filteredUsers;

    // Сохраняем обновленные данные
    const updatedDataPath = path.join(__dirname, '../data-export-updated.json');
    fs.writeFileSync(updatedDataPath, JSON.stringify(data, null, 2));

    // Сохраняем пароли отдельно
    const credentialsPath = path.join(__dirname, '../credentials.txt');
    const credentialsText = credentials.map(cred => 
      `${cred.role}: ${cred.email} / ${cred.password}`
    ).join('\n');
    fs.writeFileSync(credentialsPath, credentialsText);

    console.log(`✅ Updated ${updatedCount} users (removed ${data.users.length - updatedCount} leaders)`);
    console.log(`📁 Updated data saved to: ${updatedDataPath}`);
    console.log(`🔑 Credentials saved to: ${credentialsPath}`);
    console.log('\n🔑 New credentials:');
    credentials.forEach(cred => {
      console.log(`   ${cred.role}: ${cred.email} / ${cred.password}`);
    });

  } catch (error) {
    console.error('❌ Error updating passwords:', error);
  }
}

updatePasswords();
