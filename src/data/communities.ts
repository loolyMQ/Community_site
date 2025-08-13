import { Community, Category } from '../types';

export const categories: Category[] = [
  {
    id: 'media',
    name: 'Медиа',
    description: 'Средства массовой информации и коммуникации',
    color: '#4a9eff',
    icon: '📺'
  },
  {
    id: 'art',
    name: 'Искусство',
    description: 'Творческие направления и культурная деятельность',
    color: '#ff6b6b',
    icon: '🎨'
  },
  {
    id: 'science',
    name: 'Наука',
    description: 'Научно-исследовательская деятельность',
    color: '#4caf50',
    icon: '🔬'
  },
  {
    id: 'sport',
    name: 'Спорт',
    description: 'Спортивные секции и клубы',
    color: '#ff9800',
    icon: '⚽'
  },
  {
    id: 'career',
    name: 'Карьера',
    description: 'Профессиональное развитие и трудоустройство',
    color: '#9c27b0',
    icon: '💼'
  },
  {
    id: 'projects-events',
    name: 'Проекты-события',
    description: 'Организация мероприятий и проектов',
    color: '#e91e63',
    icon: '🎪'
  },
  {
    id: 'leisure',
    name: 'Досуг',
    description: 'Развлекательные и досуговые активности',
    color: '#00bcd4',
    icon: '🎮'
  },
  {
    id: 'oso',
    name: 'ОСО',
    description: 'Орган студенческого самоуправления',
    color: '#795548',
    icon: '🏛️'
  },
  {
    id: 'squads',
    name: 'Отряды',
    description: 'Студенческие отряды и движения',
    color: '#607d8b',
    icon: '👥'
  },
  {
    id: 'sections',
    name: 'Секции',
    description: 'Специализированные секции и кружки',
    color: '#ff5722',
    icon: '🔧'
  }
];

export const communities: Community[] = [
  {
    id: 'media-center',
    name: 'Медиацентр "Будь в курсе"',
    description: 'Создание контента для университета, ведение социальных сетей, фото- и видеосъемка мероприятий',
    categoryIds: ['media'],
    leader: {
      name: 'Анна Иванова',
      email: 'media@university.edu',
      phone: '+7 (999) 123-45-67',
      social: '@media_center'
    },
    contacts: {
      email: 'media@university.edu',
      phone: '+7 (999) 123-45-67',
      social: '@media_center'
    },
    news: [
      {
        id: 'news-1',
        title: 'Новый выпуск университетской газеты',
        content: 'Вышел в свет новый номер газеты с репортажами о последних событиях',
        date: '2024-02-15',
        author: 'Редакция медиацентра'
      }
    ],
    isOfficial: true,
    createdAt: '2023-09-01T00:00:00Z',
    updatedAt: '2024-02-15T10:30:00Z'
  },
  {
    id: 'dance-club',
    name: 'Dance Club «Paradox»',
    description: 'Современные танцы, хип-хоп, брейк-данс. Участие в конкурсах и фестивалях',
    categoryIds: ['art', 'leisure'],
    leader: {
      name: 'Мария Петрова',
      email: 'dance@university.edu',
      phone: '+7 (999) 234-56-78',
      social: '@dance_paradox'
    },
    contacts: {
      email: 'dance@university.edu',
      phone: '+7 (999) 234-56-78',
      social: '@dance_paradox'
    },
    news: [
      {
        id: 'news-2',
        title: 'Победа на городском конкурсе',
        content: 'Наша команда заняла первое место на городском конкурсе современного танца',
        date: '2024-02-10',
        author: 'Мария Петрова'
      }
    ],
    isOfficial: true,
    createdAt: '2023-10-15T00:00:00Z',
    updatedAt: '2024-02-10T15:20:00Z'
  },
  {
    id: 'sno',
    name: 'Студенческое научное общество (СНО)',
    description: 'Научно-исследовательская работа, конференции, публикации, участие в грантах',
    categoryIds: ['science'],
    leader: {
      name: 'Дмитрий Сидоров',
      email: 'sno@university.edu',
      phone: '+7 (999) 345-67-89',
      social: '@sno_university'
    },
    contacts: {
      email: 'sno@university.edu',
      phone: '+7 (999) 345-67-89',
      social: '@sno_university'
    },
    news: [
      {
        id: 'news-3',
        title: 'Международная конференция',
        content: 'Студенты СНО приняли участие в международной научной конференции',
        date: '2024-02-08',
        author: 'Дмитрий Сидоров'
      }
    ],
    isOfficial: true,
    createdAt: '2023-08-20T00:00:00Z',
    updatedAt: '2024-02-08T12:45:00Z'
  },
  {
    id: 'cyber-sport',
    name: 'Кибер «Реактор»',
    description: 'Киберспортивные дисциплины: CS:GO, Dota 2, League of Legends. Турниры и тренировки',
    categoryIds: ['sport', 'leisure'],
    leader: {
      name: 'Алексей Волков',
      email: 'cyber@university.edu',
      phone: '+7 (999) 456-78-90',
      social: '@cyber_reactor'
    },
    contacts: {
      email: 'cyber@university.edu',
      phone: '+7 (999) 456-78-90',
      social: '@cyber_reactor'
    },
    news: [
      {
        id: 'news-4',
        title: 'Победа в университетском турнире',
        content: 'Наша команда выиграла университетский турнир по CS:GO',
        date: '2024-02-12',
        author: 'Алексей Волков'
      }
    ],
    isOfficial: false,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-02-12T18:30:00Z'
  },
  {
    id: 'career-club',
    name: 'Карьерный клуб',
    description: 'Помощь в трудоустройстве, ярмарки вакансий, мастер-классы от работодателей',
    categoryIds: ['career'],
    leader: {
      name: 'Елена Козлова',
      email: 'career@university.edu',
      phone: '+7 (999) 567-89-01',
      social: '@career_club'
    },
    contacts: {
      email: 'career@university.edu',
      phone: '+7 (999) 567-89-01',
      social: '@career_club'
    },
    news: [
      {
        id: 'news-5',
        title: 'Ярмарка вакансий',
        content: 'Состоялась ярмарка вакансий с участием ведущих компаний',
        date: '2024-02-14',
        author: 'Елена Козлова'
      }
    ],
    isOfficial: true,
    createdAt: '2023-09-15T00:00:00Z',
    updatedAt: '2024-02-14T14:15:00Z'
  },
  {
    id: 'volunteer-center',
    name: 'Волонтёрский центр',
    description: 'Социальные проекты, помощь нуждающимся, экологические акции',
    categoryIds: ['projects-events'],
    leader: {
      name: 'Ольга Морозова',
      email: 'volunteer@university.edu',
      phone: '+7 (999) 678-90-12',
      social: '@volunteer_center'
    },
    contacts: {
      email: 'volunteer@university.edu',
      phone: '+7 (999) 678-90-12',
      social: '@volunteer_center'
    },
    news: [
      {
        id: 'news-6',
        title: 'Экологическая акция',
        content: 'Проведена акция по уборке территории университета',
        date: '2024-02-13',
        author: 'Ольга Морозова'
      }
    ],
    isOfficial: true,
    createdAt: '2023-11-01T00:00:00Z',
    updatedAt: '2024-02-13T09:45:00Z'
  },
  {
    id: 'board-games',
    name: 'Клуб настольных игр',
    description: 'Настольные игры, турниры, новые знакомства и интересное времяпрепровождение',
    categoryIds: ['leisure'],
    leader: {
      name: 'Игорь Смирнов',
      email: 'boardgames@university.edu',
      phone: '+7 (999) 789-01-23',
      social: '@board_games_club'
    },
    contacts: {
      email: 'boardgames@university.edu',
      phone: '+7 (999) 789-01-23',
      social: '@board_games_club'
    },
    news: [
      {
        id: 'news-7',
        title: 'Турнир по "Монополии"',
        content: 'Состоялся турнир по настольной игре "Монополия"',
        date: '2024-02-11',
        author: 'Игорь Смирнов'
      }
    ],
    isOfficial: false,
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-02-11T16:20:00Z'
  },
  {
    id: 'sound-lab',
    name: 'Лаборатория звука',
    description: 'Музыкальное творчество, запись треков, организация концертов',
    categoryIds: ['art'],
    leader: {
      name: 'Артём Новиков',
      email: 'soundlab@university.edu',
      phone: '+7 (999) 890-12-34',
      social: '@sound_lab'
    },
    contacts: {
      email: 'soundlab@university.edu',
      phone: '+7 (999) 890-12-34',
      social: '@sound_lab'
    },
    news: [
      {
        id: 'news-8',
        title: 'Новый альбом',
        content: 'Выпущен новый альбом студенческой группы',
        date: '2024-02-09',
        author: 'Артём Новиков'
      }
    ],
    isOfficial: false,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-02-09T20:10:00Z'
  }
]; 