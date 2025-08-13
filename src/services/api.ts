const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

import { AdminStats } from '../types';

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
}

// Мок-данные для демо-аутентификации
const MOCK_USERS = [
  {
    id: '1',
    name: 'Администратор',
    email: 'admin@university.edu',
    password: 'Admin123!',
    role: 'admin'
  },
  {
    id: '2',
    name: 'Модератор',
    email: 'moderator@university.edu',
    password: 'Moderator123!',
    role: 'moderator'
  }
];

// Мок-токены
const generateMockToken = () => `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Кэш для API запросов
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 600000; // 10 минут для лучшей производительности

class ApiService {
  private baseURL: string;
  private useMock: boolean;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Используем мок, если API недоступен
    this.useMock = false; // Используем реальный API
  }

  private getCacheKey(endpoint: string): string {
    return `${this.baseURL}${endpoint}`;
  }

  private getCachedData(endpoint: string): any | null {
    const key = this.getCacheKey(endpoint);
    const cached = apiCache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.data;
    }
    
    return null;
  }

  private setCachedData(endpoint: string, data: any): void {
    const key = this.getCacheKey(endpoint);
    apiCache.set(key, { data, timestamp: Date.now() });
  }

  private clearCache(): void {
    apiCache.clear();
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Если используем мок, имитируем задержку сети
    if (this.useMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Имитируем ошибку для несуществующих эндпоинтов
      if (!endpoint.includes('/auth/')) {
        throw new Error('API endpoint not found');
      }
      
      return {
        success: true,
        message: 'Mock response',
        data: {} as T
      };
    }

    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Добавляем токен авторизации если он есть
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Если токен истек или недействителен
        if (response.status === 401) {
          // Очищаем localStorage и перенаправляем на вход
          this.logout();
          // Можно добавить событие для уведомления компонентов
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        
        throw new Error(data.message || 'Ошибка запроса');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Аутентификация
  async login(credentials: LoginData): Promise<AuthResponse> {
    if (this.useMock) {
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Проверяем учетные данные
      const user = MOCK_USERS.find(u => 
        u.email === credentials.email && u.password === credentials.password
      );
      
      if (!user) {
        throw new Error('Неверный email или пароль');
      }
      
      // Создаем мок-токены
      const accessToken = generateMockToken();
      const refreshToken = generateMockToken();
      
      const authResponse: AuthResponse = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        accessToken,
        refreshToken
      };
      
      // Сохраняем токены
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(authResponse.user));
      
      return authResponse;
    }

    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data) {
      // Сохраняем токены
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data!;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.success && response.data) {
      // Сохраняем токены
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data!;
  }

  async logout(): Promise<void> {
    if (this.useMock) {
      // Имитируем задержку сети
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Очищаем локальное хранилище
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      return;
    }

    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      // Очищаем локальное хранилище
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await this.request<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      if (response.success && response.data) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Если обновление токена не удалось, очищаем хранилище
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }

    return false;
  }

  async getProfile(): Promise<any> {
    const response = await this.request('/auth/profile');
    return response.data;
  }

  // Проверка авторизации
  isAuthenticated(): boolean {
    if (this.useMock) {
      const token = localStorage.getItem('accessToken');
      const user = localStorage.getItem('user');
      return !!(token && user && token.startsWith('mock_token_'));
    }
    
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      return false;
    }
    
    // Проверяем, что токен не истек
    try {
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (tokenData.exp && tokenData.exp < currentTime) {
        // Токен истек, очищаем localStorage
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      // Если токен поврежден, очищаем localStorage
      this.logout();
      return false;
    }
  }

  getCurrentUser(): any {
    // Проверяем аутентификацию перед возвратом пользователя
    if (!this.isAuthenticated()) {
      return null;
    }
    
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Утилиты для работы с токенами
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  setAccessToken(token: string): void {
    localStorage.setItem('accessToken', token);
  }

  // Методы для работы с сообществами
  async getCommunities(): Promise<any[]> {
    // Проверяем кэш
    const cached = this.getCachedData('/communities');
    if (cached) {
      return cached;
    }

    const response = await this.request<any[]>(`/communities?_t=${Date.now()}`);
    const data = response.data || [];
    
    // Сохраняем в кэш
    this.setCachedData('/communities', data);
    return data;
  }

  async searchCommunities(query: string): Promise<any[]> {
    const encodedQuery = encodeURIComponent(query);
    const response = await this.request<any[]>(`/communities/search?q=${encodedQuery}`);
    return response.data || [];
  }

  async getCommunityById(id: string): Promise<any> {
    const response = await this.request<any>(`/communities/${id}`);
    return response.data;
  }

  async getCategories(): Promise<any[]> {
    // Проверяем кэш
    const cached = this.getCachedData('/communities/categories/all');
    if (cached) {
      return cached;
    }

    const response = await this.request<any[]>(`/communities/categories/all?_t=${Date.now()}`);
    const data = response.data || [];
    
    // Сохраняем в кэш
    this.setCachedData('/communities/categories/all', data);
    return data;
  }

  async getCommunityRelationships(): Promise<any[]> {
    // Проверяем кэш
    const cached = this.getCachedData('/communities/relationships/all');
    if (cached) {
      return cached;
    }

    const response = await this.request<any[]>(`/communities/relationships/all?_t=${Date.now()}`);
    const data = response.data || [];
    
    // Сохраняем в кэш
    this.setCachedData('/communities/relationships/all', data);
    return data;
  }

  // Requests
  async getJoinRequests(params?: { status?: 'pending' | 'approved' | 'rejected' }) {
    const qs = params?.status ? `?status=${params.status}` : '';
    const response = await this.request<any[]>(`/requests/join${qs}`);
    return response.data || [];
  }

  async getCollaborationRequests(params?: { status?: 'pending' | 'approved' | 'rejected' }) {
    const qs = params?.status ? `?status=${params.status}` : '';
    const response = await this.request<any[]>(`/requests/collaborations${qs}`);
    return response.data || [];
  }

  async updateCommunityCategories(communityId: string, payload: { mainCategoryId?: string; categoryIds?: string[] }) {
    const response = await this.request<any>(`/communities/${communityId}/categories`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    return response.data;
  }

  async createCommunity(payload: any) {
    const response = await this.request<any>(`/communities`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    // Очищаем кэш при создании
    this.clearCache();
    return response.data;
  }

  async updateCommunity(id: string, payload: any) {
    const response = await this.request<any>(`/communities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    // Очищаем кэш при обновлении
    this.clearCache();
    return response.data;
  }

  async deleteCommunity(id: string) {
    const response = await this.request<any>(`/communities/${id}`, {
      method: 'DELETE'
    });
    // Очищаем кэш при удалении
    this.clearCache();
    return response.data;
  }
}

// Создаем экземпляр API сервиса
export const apiService = new ApiService(API_BASE_URL);

// Экспортируем типы
export type { ApiResponse, LoginData, RegisterData, AuthResponse }; 

// Получение статистики админ панели
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const response = await apiService.request<AdminStats>('/communities/admin/stats');
    return response.data || {
      totalCommunities: 0,
      totalJoinRequests: 0,
      pendingJoinRequests: 0,
      totalCollaborationRequests: 0,
      pendingCollaborationRequests: 0,
      totalReviews: 0,
      pendingReviews: 0
    };
  } catch (error) {
    console.error('Ошибка при получении статистики админ панели:', error);
    // Возвращаем значения по умолчанию в случае ошибки
    return {
      totalCommunities: 0,
      totalJoinRequests: 0,
      pendingJoinRequests: 0,
      totalCollaborationRequests: 0,
      pendingCollaborationRequests: 0,
      totalReviews: 0,
      pendingReviews: 0
    };
  }
}; 