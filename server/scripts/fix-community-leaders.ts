import * as fs from 'fs';
import * as path from 'path';

async function fixCommunityLeaders() {
  try {
    console.log('🔧 Fixing community leaders...');

    // Читаем обновленные данные
    const dataPath = path.join(__dirname, '../data-export-updated.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Получаем ID админа (будем использовать его как лидера по умолчанию)
    const adminUser = data.users.find((user: any) => user.role === 'ADMIN');
    if (!adminUser) {
      throw new Error('Admin user not found!');
    }

    console.log(`👑 Using admin as default leader: ${adminUser.name} (${adminUser.id})`);

    // Обновляем все сообщества, устанавливая админа как лидера
    let updatedCount = 0;
    data.communities = data.communities.map((community: any) => {
      console.log(`🏢 Updating community: ${community.name} (leader: ${community.leaderId} -> ${adminUser.id})`);
      community.leaderId = adminUser.id;
      updatedCount++;
      return community;
    });

    // Сохраняем исправленные данные
    const fixedDataPath = path.join(__dirname, '../data-export-fixed.json');
    fs.writeFileSync(fixedDataPath, JSON.stringify(data, null, 2));

    console.log(`✅ Fixed ${updatedCount} communities`);
    console.log(`📁 Fixed data saved to: ${fixedDataPath}`);

  } catch (error) {
    console.error('❌ Error fixing community leaders:', error);
  }
}

fixCommunityLeaders();
