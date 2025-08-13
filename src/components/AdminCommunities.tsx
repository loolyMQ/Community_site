import React, { useState, useCallback, useMemo } from 'react';
import { Community, Category } from '../types';
import { useCommunities } from '../hooks/useCommunities';
import { apiService } from '../services/api';
import AddCommunityModal from './AddCommunityModal';
import EditCommunityModal from './EditCommunityModal';
import { debounce } from '../utils/debounce';

interface AdminCommunitiesProps {
  currentUser: { id: string; name: string; role: string } | null;
}

const AdminCommunities: React.FC<AdminCommunitiesProps> = ({ currentUser }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<Community | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'official' | 'unofficial'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { communities, categories, loading, error, refresh } = useCommunities();

  const filteredCommunities = useMemo(() => {
    return communities.filter(community => {
      // Фильтр по статусу
      const statusMatch = filterStatus === 'all' || 
        (filterStatus === 'official' && community.isOfficial) ||
        (filterStatus === 'unofficial' && !community.isOfficial);
      
      // Фильтр по поиску
      const searchMatch = searchQuery === '' || 
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (community.leader?.name && community.leader.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return statusMatch && searchMatch;
    });
  }, [communities, filterStatus, searchQuery]);

  // const _handleAddCommunity = (formData: CommunityFormData) => {
  //   // Здесь будет логика добавления сообщества
  //   console.log('Adding community:', formData);
  //   setShowAddModal(false);
  // };

  const handleEditCommunity = (community: Community) => {
    setEditingCommunity(community);
  };

  // Дебаунсированное обновление данных - увеличиваем интервал для лучшей производительности
  const debouncedRefresh = useCallback(
    debounce(() => {
      refresh();
    }, 5000),
    [refresh]
  );

  const handleDeleteCommunity = useCallback(async (communityId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это сообщество?')) return;
    try {
      await apiService.deleteCommunity(communityId);
      debouncedRefresh();
    } catch (e) {
      alert('Ошибка при удалении сообщества');
      console.error(e);
    }
  }, [debouncedRefresh]);

  const handleToggleOfficial = useCallback(async (communityId: string, isOfficial: boolean) => {
    try {
      await apiService.updateCommunity(communityId, { isOfficial });
      debouncedRefresh();
    } catch (e) {
      alert('Ошибка при изменении статуса');
      console.error(e);
    }
  }, [debouncedRefresh]);

  return (
    <div className="admin-communities">
      {loading && (
        <div className="loading-container" style={{ padding: 16 }}>
          Загрузка сообществ...
        </div>
      )}
      {error && (
        <div className="error-container" style={{ padding: 16 }}>
          <div style={{ marginBottom: 8 }}>Ошибка: {error}</div>
          <button className="button" onClick={refresh}>Повторить</button>
        </div>
      )}
      <div className="admin-section-header">
        <h2>
          Управление сообществами
          {currentUser?.role === 'MODERATOR' && (
            <span 
              style={{ 
                fontSize: '14px', 
                fontWeight: 'normal', 
                color: '#666',
                marginLeft: '12px'
              }}
            >
              (Модератор - ограниченные права)
            </span>
          )}
        </h2>
        <div className="admin-actions">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="form-input"
            style={{ width: 'auto', marginRight: '12px' }}
          >
            <option value="all">Все сообщества</option>
            <option value="official">Официальные</option>
            <option value="unofficial">Неофициальные</option>
          </select>
          {/* Кнопка создания сообщества только для администраторов */}
          {currentUser?.role === 'ADMIN' && (
            <button 
              className="button primary"
              onClick={() => setShowAddModal(true)}
            >
              ➕ Создать сообщество
            </button>
          )}
        </div>
      </div>

      {/* Поиск по названию */}
      <div className="search-section mb-4">
        <div className="search-container">
          <input
            type="text"
            placeholder="Поиск по названию, описанию или руководителю..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{ width: '100%', maxWidth: '400px' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="clear-search-btn"
              title="Очистить поиск"
              style={{ marginLeft: '8px' }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="communities-table">
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Категории</th>
              <th>Руководитель</th>
              <th>Участники</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredCommunities.map(community => {
              const communityCategories = categories.filter(cat => 
                community.categoryIds.includes(cat.id)
              );
              
              return (
                <tr key={community.id}>
                  <td>
                    <div className="community-name-cell">
                      <strong>{community.name}</strong>
                      <p className="community-description-small">
                        {community.description.substring(0, 50)}...
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className="categories-tags">
                      {communityCategories.map(category => (
                        <span 
                          key={category.id}
                          className="category-tag"
                          style={{ backgroundColor: category.color, fontWeight: (community.mainCategoryId || community.categoryIds[0]) === category.id ? 700 : 400 }}
                          title={(community.mainCategoryId || community.categoryIds[0]) === category.id ? 'Основная категория' : 'Доп. категория'}
                        >
                          {(community.mainCategoryId || community.categoryIds[0]) === category.id ? '★ ' : ''}{category.icon} {category.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="leader-info">
                      <div>{community.leader.name}</div>
                      {community.leader.social && (
                        <div className="leader-social">
                          {community.leader.social.split(', ').map((contact, index) => {
                            const cleanContact = contact.trim();
                            
                            // Определяем тип контакта
                            let displayName = cleanContact;
                            let isLink = false;
                            let href = cleanContact;
                            
                            if (cleanContact.includes('t.me') || cleanContact.startsWith('https://t.me/')) {
                              displayName = 'Telegram';
                              isLink = true;
                              if (!cleanContact.startsWith('http')) {
                                href = `https://t.me/${cleanContact.replace('@', '')}`;
                              }
                            } else if (cleanContact.includes('vk.com') || cleanContact.startsWith('https://vk.com/')) {
                              displayName = 'VK';
                              isLink = true;
                              if (!cleanContact.startsWith('http')) {
                                href = `https://${cleanContact}`;
                              }
                            } else if (cleanContact.includes('@') && cleanContact.includes('.')) {
                              displayName = 'Email';
                              isLink = true;
                              href = `mailto:${cleanContact}`;
                            } else if (cleanContact.startsWith('+') || /^\d/.test(cleanContact)) {
                              displayName = 'Телефон';
                              isLink = true;
                              href = `tel:${cleanContact}`;
                            } else if (cleanContact.startsWith('http')) {
                              displayName = 'Сайт';
                              isLink = true;
                            } else if (cleanContact.startsWith('@')) {
                              displayName = `Telegram ${cleanContact}`;
                              isLink = true;
                              href = `https://t.me/${cleanContact.substring(1)}`;
                            }
                            
                            if (isLink) {
                              return (
                                <a 
                                  key={index}
                                  href={href} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-400 underline"
                                  style={{ marginRight: '8px' }}
                                >
                                  {displayName}
                                </a>
                              );
                            } else {
                              return (
                                <span 
                                  key={index}
                                  className="text-gray-600"
                                  style={{ marginRight: '8px' }}
                                >
                                  {displayName}
                                </span>
                              );
                            }
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="member-count-badge">

                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${community.isOfficial ? 'official' : 'unofficial'}`}>
                      {community.isOfficial ? 'Официальное' : 'Неофициальное'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {/* Кнопки редактирования и удаления только для администраторов */}
                      {currentUser?.role === 'ADMIN' && (
                        <>
                          <button 
                            className="action-btn edit"
                            onClick={() => handleEditCommunity(community)}
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteCommunity(community.id)}
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                      
                      {/* Кнопка изменения статуса официальности доступна всем */}
                      <button 
                        className="action-btn toggle"
                        onClick={() => handleToggleOfficial(community.id, !community.isOfficial)}
                        title={
                          community.isOfficial 
                            ? 'Сделать неофициальным' 
                            : 'Сделать официальным'
                        }
                      >
                        {community.isOfficial ? '🔓' : '🔒'}
                      </button>
                      
                      {/* Информация для модераторов */}
                      {currentUser?.role === 'MODERATOR' && (
                        <span 
                          className="moderator-info"
                          title="Модераторы могут только изменять статус официальности сообществ. Редактирование и удаление доступно только администраторам."
                          style={{ 
                            fontSize: '12px', 
                            color: '#666', 
                            marginLeft: '8px',
                            cursor: 'help'
                          }}
                        >
                          ℹ️
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredCommunities.length === 0 && (
        <div className="no-data">
          <p>Сообщества не найдены</p>
        </div>
      )}

      {/* Модальное окно создания */}
      {showAddModal && (
        <AddCommunityModal 
          categories={categories as Category[]}
          onClose={() => { setShowAddModal(false); }} 
          onDataUpdate={refresh} 
        />
      )}

      {/* Модальное окно редактирования */}
      {editingCommunity && (
        <EditCommunityModal 
          community={editingCommunity}
          categories={categories as Category[]}
          onClose={() => setEditingCommunity(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
};

export default AdminCommunities; 