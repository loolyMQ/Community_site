import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from '../src/models/User';
import { Community } from '../src/models/Community';

dotenv.config();

const MONGODB_URI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/community-graph';

// Начальные данные
const initialUsers = [
  {
    name: 'Администратор Системы',
    email: 'admin@university.edu',
    password: 'Admin123!',
    role: 'admin' as const
  },
  {
    name: 'Модератор Студсовета',
    email: 'moderator@university.edu',
    password: 'Moderator123!',
    role: 'moderator' as const
  }
];

const initialCommunities = [
  {
    name: 'Медиацентр "Будь в курсе"',
    description: 'Создание контента для университета, ведение социальных сетей, организация мероприятий',
    categoryIds: ['media'],
    leader: {
      name: 'Анна Петрова',
      email: 'anna.petrova@student.edu'
    },
    contacts: {
      email: 'media@university.edu',
      phone: '+7 (999) 123-45-67'
    },
    memberCount: 15,
    isOfficial: true,
    news: [
      {
        title: 'Новый набор в медиацентр',
        content: 'Открыт набор на позиции фотографов, видеографов и копирайтеров',
        date: new Date('2024-02-15')
      }
    ]
  },
  {
    name: 'Dance Club «Paradox»',
    description: 'Современные танцы, хип-хоп, брейк-данс. Регулярные тренировки и выступления',
    categoryIds: ['art'],
    leader: {
      name: 'Михаил Сидоров',
      email: 'mikhail.sidorov@student.edu'
    },
    contacts: {
      email: 'dance@university.edu'
    },
    memberCount: 25,
    isOfficial: true,
    news: [
      {
        title: 'Победа на городском конкурсе',
        content: 'Наша команда заняла первое место на городском конкурсе танцевальных коллективов',
        date: new Date('2024-02-10')
      }
    ]
  },
  {
    name: 'Студенческое научное общество (СНО)',
    description: 'Научная деятельность, участие в конференциях, исследовательские проекты',
    categoryIds: ['science'],
    leader: {
      name: 'Елена Козлова',
      email: 'elena.kozlova@student.edu'
    },
    contacts: {
      email: 'sno@university.edu'
    },
    memberCount: 30,
    isOfficial: true,
    news: [
      {
        title: 'Международная конференция',
        content: 'Студенты СНО приняли участие в международной научной конференции',
        date: new Date('2024-02-12')
      }
    ]
  },
  {
    name: 'Кибер «Реактор»',
    description: 'Киберспорт команда университета. CS:GO, Dota 2, League of Legends',
    categoryIds: ['sport'],
    leader: {
      name: 'Алексей Волков',
      email: 'alexey.volkov@student.edu'
    },
    contacts: {
      email: 'cyber@university.edu'
    },
    memberCount: 20,
    isOfficial: true,
    news: [
      {
        title: 'Победа в турнире',
        content: 'Команда университета выиграла региональный турнир по CS:GO',
        date: new Date('2024-02-08')
      }
    ]
  },
  {
    name: 'Карьерный клуб',
    description: 'Помощь в трудоустройстве, мастер-классы, встречи с работодателями',
    categoryIds: ['career'],
    leader: {
      name: 'Ольга Иванова',
      email: 'olga.ivanova@student.edu'
    },
    contacts: {
      email: 'career@university.edu'
    },
    memberCount: 45,
    isOfficial: true,
    news: [
      {
        title: 'Ярмарка вакансий',
        content: 'Успешно проведена ярмарка вакансий с участием 20 компаний',
        date: new Date('2024-02-14')
      }
    ]
  },
  {
    name: 'Волонтерский центр',
    description: 'Социальные проекты, помощь нуждающимся, экологические акции',
    categoryIds: ['volunteer'],
    leader: {
      name: 'Дмитрий Смирнов',
      email: 'dmitry.smirnov@student.edu'
    },
    contacts: {
      email: 'volunteer@university.edu'
    },
    memberCount: 35,
    isOfficial: true,
    news: [
      {
        title: 'Экологическая акция',
        content: 'Проведена акция по уборке территории университета',
        date: new Date('2024-02-13')
      }
    ]
  },
  {
    name: 'Клуб настольных игр',
    description: 'Настольные игры, турниры, вечера игр',
    categoryIds: ['leisure'],
    leader: {
      name: 'Сергей Николаев',
      email: 'sergey.nikolaev@student.edu'
    },
    contacts: {
      email: 'games@university.edu'
    },
    memberCount: 18,
    isOfficial: false,
    news: [
      {
        title: 'Турнир по шахматам',
        content: 'Завершен турнир по шахматам среди студентов',
        date: new Date('2024-02-11')
      }
    ]
  },
  {
    name: 'Лаборатория звука',
    description: 'Музыкальное творчество, запись, сведение, создание композиций',
    categoryIds: ['art'],
    leader: {
      name: 'Мария Андреева',
      email: 'maria.andreeva@student.edu'
    },
    contacts: {
      email: 'sound@university.edu'
    },
    memberCount: 12,
    isOfficial: false,
    news: [
      {
        title: 'Новый альбом',
        content: 'Выпущен сборник студенческих композиций',
        date: new Date('2024-02-09')
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Подключение к базе данных
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Очистка существующих данных
    await User.deleteMany({});
    await Community.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Создание пользователей
    const createdUsers = [];
    for (const userData of initialUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`👤 Created user: ${user.email}`);
    }

    // Создание сообществ
    for (const communityData of initialCommunities) {
      const community = new Community(communityData);
      await community.save();
      console.log(`🏢 Created community: ${community.name}`);
    }

    console.log('✅ Database seeded successfully');
    console.log(`📊 Created ${createdUsers.length} users and ${initialCommunities.length} communities`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📴 Disconnected from MongoDB');
  }
}

// Запуск скрипта
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase }; 