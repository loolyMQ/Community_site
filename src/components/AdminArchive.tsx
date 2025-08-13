import React, { useState } from 'react';
import { getArchivedRequests, restoreJoinRequest, restoreCollaborationRequest } from '../data/adminData';
import { communities } from '../data/communities';

interface AdminArchiveProps {
  currentUser: { id: string; name: string; role: string } | null;
  onDataUpdate?: () => void;
}

const AdminArchive: React.FC<AdminArchiveProps> = ({ currentUser: _currentUser, onDataUpdate }) => {
  const [filterType, setFilterType] = useState<'all' | 'join' | 'collaboration'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [archivedRequests, setArchivedRequests] = useState(getArchivedRequests());

  // Обновляем состояние при изменении данных
  React.useEffect(() => {
    setArchivedRequests(getArchivedRequests());
  }, []);

  const getCommunityName = (communityId: string) => {
    const community = communities.find(c => c.id === communityId);
    return community?.name || 'Неизвестное сообщество';
  };

  const getContactDisplay = (contact: string) => {
    if (contact.startsWith('@')) {
      return `📱 ${contact}`;
    } else if (contact.includes('vk.com')) {
      return `💬 ${contact}`;
    } else if (contact.includes('@')) {
      return `📧 ${contact}`;
    } else {
      return `📞 ${contact}`;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { text: 'Ожидает', class: 'pending' },
      approved: { text: 'Одобрено', class: 'approved' },
      rejected: { text: 'Отклонено', class: 'rejected' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`status-badge ${config.class}`}>
        {config.text}
      </span>
    );
  };

  const handleRestoreJoin = (requestId: string) => {
    restoreJoinRequest(requestId);
    setArchivedRequests(getArchivedRequests());
    if (onDataUpdate) {
      onDataUpdate();
    }
  };

  const handleRestoreCollaboration = (requestId: string) => {
    restoreCollaborationRequest(requestId);
    setArchivedRequests(getArchivedRequests());
    if (onDataUpdate) {
      onDataUpdate();
    }
  };

  // Фильтруем заявки по типу
  const filteredRequests = {
    join: filterType === 'all' || filterType === 'join' ? archivedRequests.join : [],
    collaboration: filterType === 'all' || filterType === 'collaboration' ? archivedRequests.collaboration : []
  };

  // Сортируем заявки по дате
  const sortedJoinRequests = [...filteredRequests.join].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const sortedCollaborationRequests = [...filteredRequests.collaboration].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const totalArchived = sortedJoinRequests.length + sortedCollaborationRequests.length;

  return (
    <div className="admin-archive">
      <div className="admin-section-header">
        <h2>📦 Архив заявок ({totalArchived})</h2>
        <div className="admin-actions">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value as any)}
            className="form-input"
            style={{ width: 'auto', marginRight: '10px' }}
          >
            <option value="all">Все типы</option>
            <option value="join">Заявки на вступление</option>
            <option value="collaboration">Заявки на сотрудничество</option>
          </select>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="form-input"
            style={{ width: 'auto' }}
          >
            <option value="newest">Сначала новые</option>
            <option value="oldest">Сначала старые</option>
          </select>
        </div>
      </div>

      {sortedJoinRequests.length > 0 && (
        <div className="archive-section">
          <h3>📝 Заявки на вступление в архиве ({sortedJoinRequests.length})</h3>
          <div className="archive-table">
            <table>
              <thead>
                <tr>
                  <th>Заявитель</th>
                  <th>Сообщество</th>
                  <th>Контакты</th>
                  <th>Комментарий</th>
                  <th>Комментарий админа</th>
                  <th>Дата подачи</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {sortedJoinRequests.map(request => (
                  <tr key={request.id}>
                    <td>
                      <div className="applicant-info">
                        <div className="applicant-name">{request.name}</div>
                      </div>
                    </td>
                    <td>
                      <div className="community-info">
                        {getCommunityName(request.communityId)}
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        {getContactDisplay(request.contact)}
                      </div>
                    </td>
                    <td>
                      <div className="comment-cell">
                        {request.comment || 'Комментарий не указан'}
                      </div>
                    </td>
                    <td>
                      <div className="admin-comment-cell">
                        {request.adminComment || 'Комментарий не добавлен'}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(request.status)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn restore"
                          onClick={() => handleRestoreJoin(request.id)}
                          title="Восстановить из архива"
                        >
                          🔄
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sortedCollaborationRequests.length > 0 && (
        <div className="archive-section">
          <h3>🤝 Заявки на сотрудничество в архиве ({sortedCollaborationRequests.length})</h3>
          <div className="archive-table">
            <table>
              <thead>
                <tr>
                  <th>Организация</th>
                  <th>Сообщество</th>
                  <th>Описание предложения</th>
                  <th>Контакты</th>
                  <th>Комментарий админа</th>
                  <th>Дата подачи</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {sortedCollaborationRequests.map(request => (
                  <tr key={request.id}>
                    <td>
                      <div className="organization-info">
                        <div className="organization-name">{request.name}</div>
                      </div>
                    </td>
                    <td>
                      <div className="community-info">
                        {getCommunityName(request.communityId)}
                      </div>
                    </td>
                    <td>
                      <div className="description-cell">
                        {request.description}
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        {getContactDisplay(request.contact)}
                      </div>
                    </td>
                    <td>
                      <div className="admin-comment-cell">
                        {request.adminComment || 'Комментарий не добавлен'}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(request.status)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn restore"
                          onClick={() => handleRestoreCollaboration(request.id)}
                          title="Восстановить из архива"
                        >
                          🔄
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalArchived === 0 && (
        <div className="no-data">
          <p>Архив пуст</p>
        </div>
      )}
    </div>
  );
};

export default AdminArchive; 