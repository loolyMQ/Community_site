import React, { useState, useEffect } from 'react';

import { apiService } from '../services/api';
import AdminCommunities from './AdminCommunities';
import AdminRequests from './AdminRequests';
import AdminCollaborations from './AdminCollaborations';
import AdminArchive from './AdminArchive';
import AdminReviews from './AdminReviews';
import AdminLogin from './AdminLogin';
import { getAdminStats } from '../services/api';
import { AdminStats } from '../types';

import ASCIIText from "./ASCIIText";

interface AdminPanelProps {
  onClose: () => void;
  dataVersion?: number;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, dataVersion }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'communities' | 'requests' | 'collaborations' | 'archive' | 'reviews'>('dashboard');
  const FEATURE_REQUESTS = import.meta.env.VITE_FEATURE_REQUESTS === 'true';
  const [stats, setStats] = useState<AdminStats>({
    totalCommunities: 0,
    totalJoinRequests: 0,
    pendingJoinRequests: 0,
    totalCollaborationRequests: 0,
    pendingCollaborationRequests: 0,
    totalReviews: 0,
    pendingReviews: 0
  });

  // const pendingRequests = getPendingRequests();
  // const archivedRequests = getArchivedRequests();

  // Проверка аутентификации при загрузке
  useEffect(() => {
    if (apiService.isAuthenticated()) {
      const user = apiService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    }
  }, []);

  // Слушаем событие истечения токена
  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  // Загружаем статистику из API только при аутентификации
  useEffect(() => {
    const loadStats = async () => {
      try {
        const adminStats = await getAdminStats();
        setStats(adminStats);
      } catch (error) {
        console.error('Ошибка при загрузке статистики:', error);
      }
    };

    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]); // Убрал activeTab из зависимостей

  const handleLogin = (user: { id: string; name: string; role: string }) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  const handleTabChange = (tab: 'dashboard' | 'communities' | 'requests' | 'collaborations' | 'archive' | 'reviews') => {
    setActiveTab(tab);
  };

  const handleDataUpdate = async () => {
    // Обновляем статистику при изменении данных
    try {
      const adminStats = await getAdminStats();
      setStats(adminStats);
    } catch (error) {
      console.error('Ошибка при обновлении статистики:', error);
    }
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} onClose={onClose} />;
  }

  return (
    <div className="admin-panel">
      {/* Заголовок админ-панели */}
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Админ-панель</h1>
          <p>Добро пожаловать, {currentUser?.name}</p>
          <div className="session-info">
            <span className="session-status">🟢 Сессия активна</span>
            <span className="user-role">{currentUser?.role}</span>
          </div>
        </div>
        <div className="admin-header-right">
          <button className="button" onClick={handleLogout}>
            Выйти
          </button>
          <button className="button" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>

      {/* Навигация */}
      <div className="admin-nav">
        <button 
          className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleTabChange('dashboard')}
        >
          📊 Дашборд
        </button>
        <button 
          className={`admin-nav-btn ${activeTab === 'communities' ? 'active' : ''}`}
          onClick={() => handleTabChange('communities')}
        >
          🏢 Сообщества
        </button>
        {FEATURE_REQUESTS && (
          <button 
            className={`admin-nav-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => handleTabChange('requests')}
          >
            📝 Заявки на вступление
            {stats.pendingJoinRequests > 0 && (
              <span className="badge">{stats.pendingJoinRequests}</span>
            )}
          </button>
        )}
        {FEATURE_REQUESTS && (
          <button 
            className={`admin-nav-btn ${activeTab === 'collaborations' ? 'active' : ''}`}
            onClick={() => handleTabChange('collaborations')}
          >
            🤝 Заявки на сотрудничество
            {stats.pendingCollaborationRequests > 0 && (
              <span className="badge">{stats.pendingCollaborationRequests}</span>
            )}
          </button>
        )}
        {FEATURE_REQUESTS && (
          <button 
            className={`admin-nav-btn ${activeTab === 'archive' ? 'active' : ''}`}
            onClick={() => handleTabChange('archive')}
          >
            📦 Архив
          </button>
        )}
        <button 
          className={`admin-nav-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => handleTabChange('reviews')}
        >
          ⭐ Отзывы
          {stats.pendingReviews > 0 && (
            <span className="badge">{stats.pendingReviews}</span>
          )}
        </button>
      </div>

      {/* Контент */}
      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="admin-dashboard">
            <h2>Статистика системы</h2>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏢</div>
                <div className="stat-info">
                  <h3>Сообщества</h3>
                  <div className="stat-numbers">
                    <span className="stat-main">{stats.totalCommunities}</span>
                    <span className="stat-detail">
                      активных сообществ
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📝</div>
                <div className="stat-info">
                  <h3>Заявки на вступление</h3>
                  <div className="stat-numbers">
                    <span className="stat-main">{stats.totalJoinRequests}</span>
                    <span className="stat-detail">
                      {stats.pendingJoinRequests} ожидают рассмотрения
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🤝</div>
                <div className="stat-info">
                  <h3>Заявки на сотрудничество</h3>
                  <div className="stat-numbers">
                    <span className="stat-main">{stats.totalCollaborationRequests}</span>
                    <span className="stat-detail">
                      {stats.pendingCollaborationRequests} ожидают рассмотрения
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-info">
                  <h3>Отзывы</h3>
                  <div className="stat-numbers">
                    <span className="stat-main">{stats.totalReviews}</span>
                    <span className="stat-detail">
                      {stats.pendingReviews} ожидают модерации
                    </span>
                  </div>
                </div>
              </div>



              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-info">
                  <h3>Требуют внимания</h3>
                  <div className="stat-numbers">
                    <span className="stat-main">
                      {stats.pendingJoinRequests + stats.pendingCollaborationRequests + stats.pendingReviews}
                    </span>
                    <span className="stat-detail">
                      необработанных заявок и отзывов
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>Архив заявок</h3>
                  <div className="stat-numbers">
                    <span className="stat-main">
                      {stats.totalJoinRequests + stats.totalCollaborationRequests}
                    </span>
                    <span className="stat-detail">
                      всего заявок в системе
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-info">
                  <h3>Обработанные</h3>
                  <div className="stat-numbers">
                    <span className="stat-main">
                      {(stats.totalJoinRequests - stats.pendingJoinRequests) + 
                       (stats.totalCollaborationRequests - stats.pendingCollaborationRequests)}
                    </span>
                    <span className="stat-detail">
                      заявок обработано
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card ascii-background-card">
                <ASCIIText 
                  text={currentUser?.role === 'MODERATOR' ? 'Moder' : 'Admin'} 
                  asciiFontSize={8} 
                  textFontSize={1000} 
                  textColor="#ffffff" 
                  planeBaseHeight={12} 
                  enableWaves={false} 
                />
              </div>
            </div>

            <div className="quick-actions">
              <h3>Быстрые действия</h3>
              <div className="quick-actions-grid">
                <button 
                  className="quick-action-btn"
                  onClick={() => handleTabChange('communities')}
                >
                  <span className="shiny-text" data-text="➕ Создать сообщество">➕ Создать сообщество</span>
                </button>
                <button 
                  className="quick-action-btn"
                  onClick={() => handleTabChange('requests')}
                >
                  <span className="shiny-text" data-text="📋 Просмотреть заявки">📋 Просмотреть заявки</span>
                </button>
                <button 
                  className="quick-action-btn"
                  onClick={() => handleTabChange('collaborations')}
                >
                  <span className="shiny-text" data-text="🤝 Рассмотреть сотрудничество">🤝 Рассмотреть сотрудничество</span>
                </button>
              </div>
            </div>

            <div className="security-status">
                              <h3>🛡️ Статус безопасности</h3>
              <div className="security-grid">
                <div className="security-item">
                  <span className="security-icon">✅</span>
                  <span>Сессия активна</span>
                </div>
                <div className="security-item">
                  <span className="security-icon">✅</span>
                  <span>JWT токен валиден</span>
                </div>
                <div className="security-item">
                  <span className="security-icon">✅</span>
                  <span>Права доступа: {currentUser?.role}</span>
                </div>
                <div className="security-item">
                  <span className="security-icon">✅</span>
                  <span>Серверная аутентификация</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'communities' && (
          <AdminCommunities currentUser={currentUser} />
        )}

        {activeTab === 'requests' && (
          <AdminRequests currentUser={currentUser} onDataUpdate={handleDataUpdate} />
        )}

        {activeTab === 'collaborations' && (
          <AdminCollaborations currentUser={currentUser} onDataUpdate={handleDataUpdate} />
        )}

        {activeTab === 'archive' && (
          <AdminArchive currentUser={currentUser} onDataUpdate={handleDataUpdate} />
        )}

        {activeTab === 'reviews' && (
          <AdminReviews dataVersion={dataVersion || 0} currentUser={currentUser} />
        )}
      </div>
    </div>
  );
};

export default AdminPanel; 
