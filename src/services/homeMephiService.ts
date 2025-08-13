// 🏠 Заглушка для интеграции с home.mephi
// Для включения интеграции установите ENABLE_HOME_MEPHI_INTEGRATION = true

const ENABLE_HOME_MEPHI_INTEGRATION = false; // 🚫 ИНТЕГРАЦИЯ ОТКЛЮЧЕНА

export interface HomeMephiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  faculty?: string;
  course?: number;
  group?: string;
  studentId?: string;
}

export interface HomeMephiAuthResponse {
  success: boolean;
  user?: HomeMephiUser;
  error?: string;
}

class HomeMephiService {
  private baseUrl = 'https://home.mephi.ru/api'; // Заглушка URL
  private isEnabled = ENABLE_HOME_MEPHI_INTEGRATION;

  /**
   * Проверяет, включена ли интеграция с home.mephi
   */
  isIntegrationEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Аутентификация через home.mephi
   * @param credentials - учетные данные пользователя
   */
  async authenticate(credentials: { email: string; password: string }): Promise<HomeMephiAuthResponse> {
    if (!this.isEnabled) {
      // Заглушка - возвращаем тестовые данные
      return this.getMockUser(credentials.email);
    }

    try {
      // TODO: Реальная интеграция с home.mephi
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Ошибка аутентификации');
      }

      const data = await response.json();
      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error('Ошибка интеграции с home.mephi:', error);
      return {
        success: false,
        error: 'Ошибка подключения к home.mephi',
      };
    }
  }

  /**
   * Получение информации о пользователе по токену
   * @param token - токен доступа
   */
  async getUserInfo(token: string): Promise<HomeMephiAuthResponse> {
    if (!this.isEnabled) {
      // Заглушка - возвращаем тестовые данные
      return this.getMockUser('test@mephi.ru');
    }

    try {
      // TODO: Реальная интеграция с home.mephi
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка получения данных пользователя');
      }

      const data = await response.json();
      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error);
      return {
        success: false,
        error: 'Ошибка получения данных пользователя',
      };
    }
  }

  /**
   * Валидация токена home.mephi
   * @param token - токен для валидации
   */
  async validateToken(token: string): Promise<boolean> {
    if (!this.isEnabled) {
      // Заглушка - всегда возвращаем true
      return true;
    }

    try {
      // TODO: Реальная валидация токена
      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Ошибка валидации токена:', error);
      return false;
    }
  }

  /**
   * Заглушка для тестовых данных пользователя
   */
  private getMockUser(email: string): HomeMephiAuthResponse {
    const mockUsers: Record<string, HomeMephiUser> = {
      'test@mephi.ru': {
        id: 'mock-user-1',
        email: 'test@mephi.ru',
        firstName: 'Иван',
        lastName: 'Иванов',
        middleName: 'Иванович',
        faculty: 'Институт интеллектуальных кибернетических систем',
        course: 3,
        group: 'ИКБО-01-21',
        studentId: '12345678',
      },
      'student@mephi.ru': {
        id: 'mock-user-2',
        email: 'student@mephi.ru',
        firstName: 'Мария',
        lastName: 'Петрова',
        middleName: 'Сергеевна',
        faculty: 'Институт ядерной физики и технологий',
        course: 2,
        group: 'ЯФБО-02-22',
        studentId: '87654321',
      },
    };

    const user = mockUsers[email] || {
      id: 'mock-user-default',
      email: email,
      firstName: 'Тестовый',
      lastName: 'Пользователь',
      middleName: 'Тестович',
      faculty: 'Тестовый факультет',
      course: 1,
      group: 'ТЕСТ-01-23',
      studentId: '00000000',
    };

    return {
      success: true,
      user,
    };
  }

  /**
   * Включение/выключение интеграции (для разработки)
   */
  toggleIntegration(): void {
    this.isEnabled = !this.isEnabled;
    console.log(`🔧 Интеграция с home.mephi ${this.isEnabled ? 'включена' : 'отключена'}`);
  }

  /**
   * Получение статуса интеграции
   */
  getIntegrationStatus(): { enabled: boolean; baseUrl: string } {
    return {
      enabled: this.isEnabled,
      baseUrl: this.baseUrl,
    };
  }
}

// Экспортируем единственный экземпляр сервиса
export const homeMephiService = new HomeMephiService();

// Экспортируем константу для быстрого включения/выключения
export { ENABLE_HOME_MEPHI_INTEGRATION };

// 🚀 Быстрые команды для разработки:
// homeMephiService.toggleIntegration() - включить/выключить интеграцию
// homeMephiService.getIntegrationStatus() - получить статус
// ENABLE_HOME_MEPHI_INTEGRATION = true - включить интеграцию навсегда
