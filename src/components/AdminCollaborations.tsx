import React, { useMemo } from 'react';
import { 
  collaborationRequests, 
  updateCollaborationRequestStatus,
  addCollaborationRequestComment,
  archiveCollaborationRequest
} from '../data/adminData';
import { communities } from '../data/communities';

interface AdminCollaborationsProps {
  currentUser: { id: string; name: string; role: string } | null;
  onDataUpdate?: () => void;
}

const AdminCollaborations: React.FC<AdminCollaborationsProps> = ({ currentUser, onDataUpdate }) => {
  const FEATURE_REQUESTS = import.meta.env.VITE_FEATURE_REQUESTS === 'true';
  const hidden = useMemo(() => !FEATURE_REQUESTS, [FEATURE_REQUESTS]);

  const filteredRequests = requests.filter(request => {
    // Сначала фильтруем по статусу
    const statusMatch = filterStatus === 'all' || request.status === filterStatus;
    // Затем исключаем архивные заявки
    return statusMatch && !request.isArchived;
  });

  // Сортируем заявки по дате
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const handleUpdateStatus = (requestId: string, status: 'approved' | 'rejected') => {
    if (currentUser) {
      updateCollaborationRequestStatus(requestId, status, currentUser.id);
      // Обновляем состояние компонента
      setRequests([...collaborationRequests]);
      // Уведомляем родительский компонент об обновлении данных
      if (onDataUpdate) {
        onDataUpdate();
      }
    }
  };

  const handleAddComment = (requestId: string) => {
    if (currentUser && adminComment.trim()) {
      addCollaborationRequestComment(requestId, adminComment.trim(), currentUser.id);
      setRequests([...collaborationRequests]);
      setCommentingRequest(null);
      setAdminComment('');
      if (onDataUpdate) {
        onDataUpdate();
      }
    }
  };

  const handleArchive = (requestId: string) => {
    archiveCollaborationRequest(requestId);
    // Создаем новый массив для принудительного обновления
    setRequests([...collaborationRequests]);
    if (onDataUpdate) {
      onDataUpdate();
    }
  };

  // Обновляем состояние при изменении данных
  React.useEffect(() => {
    setRequests([...collaborationRequests]);
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

  return (
    <div className="admin-collaborations">
      <div className="admin-section-header">
        <h2>Заявки на сотрудничество</h2>
        {hidden && <div className="text-sm text-gray-400">Функция временно скрыта</div>}
      </div>

      {!hidden && (
      <div className="collaborations-table">
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
            {sortedRequests.map(request => (
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
                    {request.status === 'pending' ? (
                      <>
                        <button 
                          className="action-btn approve"
                          onClick={() => handleUpdateStatus(request.id, 'approved')}
                          title="Одобрить"
                        >
                          ✅
                        </button>
                        <button 
                          className="action-btn reject"
                          onClick={() => handleUpdateStatus(request.id, 'rejected')}
                          title="Отклонить"
                        >
                          ❌
                        </button>
                      </>
                    ) : (
                      <div className="processed-info">
                        {request.processedAt && (
                          <div className="processed-date">
                            Обработано: {new Date(request.processedAt).toLocaleDateString('ru-RU')}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <button 
                      className="action-btn comment"
                      onClick={() => setCommentingRequest(commentingRequest === request.id ? null : request.id)}
                      title="Добавить комментарий"
                    >
                      💬
                    </button>
                    
                    <button 
                      className="action-btn archive"
                      onClick={() => handleArchive(request.id)}
                      title="Отправить в архив"
                    >
                      📦
                    </button>
                  </div>
                  
                  {commentingRequest === request.id && (
                    <div className="comment-form">
                      <textarea
                        value={adminComment}
                        onChange={(e) => setAdminComment(e.target.value)}
                        placeholder="Введите комментарий администратора..."
                        className="form-textarea"
                        style={{ marginTop: '8px', width: '100%' }}
                      />
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <button 
                          className="button primary"
                          onClick={() => handleAddComment(request.id)}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          Сохранить
                        </button>
                        <button 
                          className="button"
                          onClick={() => {
                            setCommentingRequest(null);
                            setAdminComment('');
                          }}
                          style={{ fontSize: '12px', padding: '4px 8px' }}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {!hidden && sortedRequests.length === 0 && (
        <div className="no-data">
          <p>Заявки на сотрудничество не найдены</p>
        </div>
      )}
    </div>
  );
};

export default AdminCollaborations; 