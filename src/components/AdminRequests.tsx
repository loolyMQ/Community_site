import React, { useState } from 'react';
import { 
  joinRequests, 
  updateJoinRequestStatus, 
  addJoinRequestComment,
  archiveJoinRequest
} from '../data/adminData';
import { communities } from '../data/communities';
// import { JoinFormData } from '../types';

interface AdminRequestsProps {
  currentUser: { id: string; name: string; role: string } | null;
  onDataUpdate?: () => void;
}

const AdminRequests: React.FC<AdminRequestsProps> = ({ currentUser, onDataUpdate }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [requests, setRequests] = useState(joinRequests);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [commentingRequest, setCommentingRequest] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState('');

  const FEATURE_REQUESTS = import.meta.env.VITE_FEATURE_REQUESTS === 'true';
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
      updateJoinRequestStatus(requestId, status, currentUser.id);
      // Обновляем состояние компонента
      setRequests([...joinRequests]);
      // Уведомляем родительский компонент об обновлении данных
      if (onDataUpdate) {
        onDataUpdate();
      }
    }
  };

  const handleAddComment = (requestId: string) => {
    if (currentUser && adminComment.trim()) {
      addJoinRequestComment(requestId, adminComment.trim(), currentUser.id);
      setRequests([...joinRequests]);
      setCommentingRequest(null);
      setAdminComment('');
      if (onDataUpdate) {
        onDataUpdate();
      }
    }
  };

  const handleArchive = (requestId: string) => {
    archiveJoinRequest(requestId);
    // Создаем новый массив для принудительного обновления
    setRequests([...joinRequests]);
    if (onDataUpdate) {
      onDataUpdate();
    }
  };

  // Обновляем состояние при изменении данных
  React.useEffect(() => {
    setRequests([...joinRequests]);
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
    <div className="admin-requests">
      <div className="admin-section-header">
        <h2>Заявки на вступление в сообщества</h2>
        <div className="admin-actions">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="form-input"
            style={{ width: 'auto', marginRight: '10px' }}
          >
            <option value="all">Все заявки</option>
            <option value="pending">Ожидающие</option>
            <option value="approved">Одобренные</option>
            <option value="rejected">Отклоненные</option>
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

      <div className="requests-table">
        <table>
          <thead>
            <tr>
              <th>Сообщество</th>
              <th>{FEATURE_REQUESTS ? 'Ссылка на соцсеть' : 'Ссылка (скрытая ф-ция)'}</th>
              <th>{FEATURE_REQUESTS ? 'Мини-описание' : 'Описание (скрытая ф-ция)'}</th>
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
                  <div className="community-info">
                    {getCommunityName(request.communityId)}
                  </div>
                </td>
                <td>
                  <div className="contact-cell">
                    {FEATURE_REQUESTS ? (<a href="#" className="text-blue-400 underline">#</a>) : (<span className="text-gray-500">скрыто</span>)}
                  </div>
                </td>
                <td>
                  <div className="comment-cell">
                    {FEATURE_REQUESTS ? 'Мини-описание пользователя' : <span className="text-gray-500">скрыто</span>}
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

      {sortedRequests.length === 0 && (
        <div className="no-data">
          <p>Заявки не найдены</p>
        </div>
      )}
    </div>
  );
};

export default AdminRequests; 