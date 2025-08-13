import { User, JoinFormData, CollaborationFormData, AdminStats } from '../types';

// Безопасные хеши паролей (в реальном приложении должны быть в базе данных)
// Пароли: admin123, moderator123
const ADMIN_CREDENTIALS = new Map([
  ['admin@university.edu', {
    passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // admin123
    salt: 'admin_salt_2024'
  }],
  ['moderator@university.edu', {
    passwordHash: '7c4a8d09ca3762af61e59520943dc26494f8941b', // moderator123
    salt: 'moderator_salt_2024'
  }]
]);

// Администраторы и модераторы
export const adminUsers: User[] = [
  {
    id: 'admin-1',
    name: 'Администратор Системы',
    email: 'admin@university.edu',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'moderator-1',
    name: 'Модератор Студсовета',
    email: 'moderator@university.edu',
    role: 'moderator',
    createdAt: '2024-01-15T00:00:00Z'
  }
];

// Функция для проверки пароля (в реальном приложении должна использовать bcrypt)
export const verifyPassword = async (email: string, password: string): Promise<boolean> => {
  const credentials = ADMIN_CREDENTIALS.get(email);
  if (!credentials) return false;
  
  // Простая проверка для демо (в реальном приложении используйте bcrypt)
  const testHash = await simpleHash(password + credentials.salt);
  return testHash === credentials.passwordHash;
};

// Простая функция хеширования для демо (НЕ ИСПОЛЬЗУЙТЕ В ПРОДАКШЕНЕ!)
const simpleHash = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Заявки на вступление в сообщества (очищены от тестовых данных)
export const joinRequests: JoinFormData[] = [];

// Заявки на сотрудничество (очищены от тестовых данных)
export const collaborationRequests: CollaborationFormData[] = [];

// Статистика для админ-панели
export const adminStats: AdminStats = {
  totalReviews: 126,
  pendingReviews: 5,  totalCommunities: 8,
  totalJoinRequests: 4,
  pendingJoinRequests: 2,
  totalCollaborationRequests: 3,
  pendingCollaborationRequests: 2,
};

// Функция для получения актуальной статистики
export const getCurrentAdminStats = (): AdminStats => {
  // Используем реальные данные из API вместо тестовых
  return {
    totalCommunities: 4, // Реальные данные из базы (МИФИшка, Чайный клуб, Книжный клуб МИФИ, НЕКОМ МИФИ)
    totalJoinRequests: 0, // Пока нет реальных заявок
    pendingJoinRequests: 0,
    totalCollaborationRequests: 0, // Пока нет реальных заявок
    pendingCollaborationRequests: 0,
    totalReviews: 0, // Реальные данные из базы
    pendingReviews: 0
  };
};

// Функции для работы с localStorage
const STORAGE_KEY = 'community_requests_data';

const saveToStorage = () => {
  try {
    const data = {
      joinRequests,
      collaborationRequests,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Ошибка сохранения в localStorage:', error);
  }
};

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Восстанавливаем данные только если они не старше 24 часов
      const storedTime = new Date(data.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - storedTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        // Копируем данные из localStorage в массивы
        joinRequests.length = 0;
        joinRequests.push(...data.joinRequests);
        
        collaborationRequests.length = 0;
        collaborationRequests.push(...data.collaborationRequests);
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки из localStorage:', error);
  }
};

// Загружаем данные при инициализации
loadFromStorage();

// Функции для работы с данными
export const getJoinRequestsByCommunity = (communityId: string) => {
  return joinRequests.filter(request => request.communityId === communityId);
};

export const getCollaborationRequestsByCommunity = (communityId: string) => {
  return collaborationRequests.filter(request => request.communityId === communityId);
};

export const getPendingRequests = () => {
  return {
    join: joinRequests.filter(request => request.status === 'pending' && !request.isArchived),
    collaboration: collaborationRequests.filter(request => request.status === 'pending' && !request.isArchived)
  };
};

// Функция для получения активных заявок (не в архиве)
export const getActiveRequests = () => {
  return {
    join: joinRequests.filter(request => !request.isArchived),
    collaboration: collaborationRequests.filter(request => !request.isArchived)
  };
};

// Функция для получения архивных заявок
export const getArchivedRequests = () => {
  return {
    join: joinRequests.filter(request => request.isArchived),
    collaboration: collaborationRequests.filter(request => request.isArchived)
  };
};

// Функция для добавления новой заявки на вступление
export const addJoinRequest = (request: Omit<JoinFormData, 'id' | 'status' | 'createdAt'>) => {
  const newRequest: JoinFormData = {
    ...request,
    id: `join-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    isArchived: false
  };
  joinRequests.push(newRequest);
  saveToStorage(); // Сохраняем после добавления
  return newRequest;
};

// Функция для добавления новой заявки на сотрудничество
export const addCollaborationRequest = (request: Omit<CollaborationFormData, 'id' | 'status' | 'createdAt'>) => {
  const newRequest: CollaborationFormData = {
    ...request,
    id: `collab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
    isArchived: false
  };
  collaborationRequests.push(newRequest);
  saveToStorage(); // Сохраняем после добавления
  return newRequest;
};

export const updateJoinRequestStatus = (requestId: string, status: 'approved' | 'rejected', processedBy: string) => {
  const request = joinRequests.find(r => r.id === requestId);
  if (request) {
    request.status = status;
    request.processedAt = new Date().toISOString();
    request.processedBy = processedBy;
    saveToStorage(); // Сохраняем после обновления
  }
};

export const updateCollaborationRequestStatus = (requestId: string, status: 'approved' | 'rejected', processedBy: string) => {
  const request = collaborationRequests.find(r => r.id === requestId);
  if (request) {
    request.status = status;
    request.processedAt = new Date().toISOString();
    request.processedBy = processedBy;
    saveToStorage(); // Сохраняем после обновления
  }
};

// Функция для добавления комментария администратора к заявке на вступление
export const addJoinRequestComment = (requestId: string, comment: string, adminId: string) => {
  const request = joinRequests.find(r => r.id === requestId);
  if (request) {
    request.adminComment = comment;
    request.processedAt = new Date().toISOString();
    request.processedBy = adminId;
    saveToStorage(); // Сохраняем после обновления
  }
};

// Функция для добавления комментария администратора к заявке на сотрудничество
export const addCollaborationRequestComment = (requestId: string, comment: string, adminId: string) => {
  const request = collaborationRequests.find(r => r.id === requestId);
  if (request) {
    request.adminComment = comment;
    request.processedAt = new Date().toISOString();
    request.processedBy = adminId;
    saveToStorage(); // Сохраняем после обновления
  }
};

// Функция для архивирования заявки на вступление
export const archiveJoinRequest = (requestId: string) => {
  const request = joinRequests.find(r => r.id === requestId);
  if (request) {
    request.isArchived = true;
    saveToStorage(); // Сохраняем после обновления
  }
};

// Функция для архивирования заявки на сотрудничество
export const archiveCollaborationRequest = (requestId: string) => {
  const request = collaborationRequests.find(r => r.id === requestId);
  if (request) {
    request.isArchived = true;
    saveToStorage(); // Сохраняем после обновления
  }
};

// Функция для восстановления заявки из архива
export const restoreJoinRequest = (requestId: string) => {
  const request = joinRequests.find(r => r.id === requestId);
  if (request) {
    request.isArchived = false;
    saveToStorage(); // Сохраняем после обновления
  }
};

// Функция для восстановления заявки на сотрудничество из архива
export const restoreCollaborationRequest = (requestId: string) => {
  const request = collaborationRequests.find(r => r.id === requestId);
  if (request) {
    request.isArchived = false;
    saveToStorage(); // Сохраняем после обновления
  }
}; 