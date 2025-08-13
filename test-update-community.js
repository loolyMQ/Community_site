const axios = require('axios');

async function testUpdateCommunity() {
  try {
    console.log('🧪 Тестируем обновление сообщества...');
    
    // Сначала получаем список сообществ
    const communitiesResponse = await axios.get('http://localhost:3001/api/communities');
    const communities = communitiesResponse.data.data;
    
    if (communities.length === 0) {
      console.log('❌ Нет сообществ для тестирования');
      return;
    }
    
    const testCommunity = communities[0];
    console.log(`📝 Тестируем сообщество: ${testCommunity.name} (ID: ${testCommunity.id})`);
    
    // Получаем категории
    const categoriesResponse = await axios.get('http://localhost:3001/api/categories');
    const categories = categoriesResponse.data.data;
    
    if (categories.length === 0) {
      console.log('❌ Нет категорий для тестирования');
      return;
    }
    
    const testCategory = categories[0];
    console.log(`📂 Используем категорию: ${testCategory.name} (ID: ${testCategory.id})`);
    
    // Данные для обновления
    const updateData = {
      name: testCommunity.name + ' (обновлено)',
      description: testCommunity.description + ' - обновлено в тесте',
      mainCategoryId: testCategory.id,
      categoryIds: [testCategory.id],
      contacts: {
        social: 'https://t.me/test_community'
      },
      leader: {
        name: 'Тестовый руководитель',
        social: 'https://t.me/test_leader'
      }
    };
    
    console.log('📤 Отправляем данные обновления:', JSON.stringify(updateData, null, 2));
    
    // Обновляем сообщество
    const updateResponse = await axios.put(`http://localhost:3001/api/communities/${testCommunity.id}`, updateData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer admin-token' // Временно для теста
      }
    });
    
    console.log('✅ Ответ сервера:', JSON.stringify(updateResponse.data, null, 2));
    
    // Проверяем, что обновление применилось
    const updatedResponse = await axios.get(`http://localhost:3001/api/communities/${testCommunity.id}`);
    const updatedCommunity = updatedResponse.data.data;
    
    console.log('🔍 Проверяем обновленное сообщество:');
    console.log(`   Название: ${updatedCommunity.name}`);
    console.log(`   Описание: ${updatedCommunity.description}`);
    console.log(`   Основная категория: ${updatedCommunity.mainCategoryId}`);
    console.log(`   Категории: ${updatedCommunity.categories.map(c => c.category.name).join(', ')}`);
    console.log(`   Контакты: ${JSON.stringify(updatedCommunity.telegram)}`);
    console.log(`   Руководитель: ${updatedCommunity.leader.name}`);
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.response?.data || error.message);
  }
}

testUpdateCommunity();
