import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Notification from './Notification';

interface Review {
  id: string;
  rating: number;
  title?: string;
  content: string;
  isAnonymous: boolean;
  isVerified: boolean;
  isPublished: boolean;
  adminComment?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    faculty?: string;
    course?: number;
  };
  community: {
    id: string;
    name: string;
  };
  // 🏠 Поля для интеграции с home.mephi
  homeMephiUserId?: string;
  homeMephiFirstName?: string;
  homeMephiLastName?: string;
  homeMephiMiddleName?: string;
  homeMephiFaculty?: string;
  homeMephiCourse?: number;
  homeMephiGroup?: string;
  homeMephiStudentId?: string;
}

interface AdminReviewsProps {
  dataVersion: number;
  currentUser: { id: string; name: string; role: string } | null;
}

const AdminReviews: React.FC<AdminReviewsProps> = ({ dataVersion, currentUser }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [page] = useState(1);
  const [, setTotalPages] = useState(1);
  const [commentingReview, setCommentingReview] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState('');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setNotification({
          message: 'Необходима авторизация',
          type: 'error'
        });
        return;
      }

      const response = await axios.get(
        `http://localhost:3001/api/reviews/moderation?status=${status}&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const { reviews, pagination } = response.data.data;
      setReviews(reviews);
      setTotalPages(pagination.pages);
      
      // Сохраняем статистику отзывов для дашборда
      const pendingCount = reviews.filter((r: Review) => !r.isVerified).length;
      const totalCount = pagination.total || reviews.length;
      localStorage.setItem('reviews_stats', JSON.stringify({
        total: totalCount,
        pending: pendingCount,
        timestamp: new Date().toISOString()
      }));
    } catch (error: any) {
      console.error('Ошибка загрузки отзывов:', error);
      if (error.response?.status === 403) {
        setNotification({
          message: 'Недостаточно прав для модерации отзывов',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [status, page, dataVersion]);

  const handleModerate = async (reviewId: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setNotification({
          message: 'Необходима авторизация',
          type: 'error'
        });
        return;
      }

      await axios.put(
        `http://localhost:3001/api/reviews/${reviewId}/moderate`,
        {
          action,
          adminComment: '' // Пустой комментарий для прямого одобрения/отклонения
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setNotification({
        message: action === 'approve' ? 'Отзыв одобрен и отправлен в архив!' : 'Отзыв отклонен и отправлен в архив!',
        type: 'success'
      });
      loadReviews();
    } catch (error: any) {
      console.error('Ошибка модерации:', error);
      setNotification({
        message: 'Ошибка при модерации отзыва',
        type: 'error'
      });
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setNotification({
          message: 'Необходима авторизация',
          type: 'error'
        });
        return;
      }

      await axios.delete(`http://localhost:3001/api/reviews/${reviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotification({
        message: 'Отзыв удален!',
        type: 'success'
      });
      loadReviews();
    } catch (error: any) {
      console.error('Ошибка удаления:', error);
      setNotification({
        message: 'Ошибка при удалении отзыва',
        type: 'error'
      });
    }
  };

  const handleAddComment = async (reviewId: string) => {
    if (!adminComment.trim()) return;

    try {
      await axios.put(
        `http://localhost:3001/api/reviews/${reviewId}/moderate`,
        {
          action: 'comment',
          adminComment: adminComment.trim()
        }
      );

      setNotification({
        message: 'Комментарий добавлен!',
        type: 'success'
      });
      setCommentingReview(null);
      setAdminComment('');
      loadReviews();
    } catch (error: any) {
      console.error('Ошибка добавления комментария:', error);
      setNotification({
        message: 'Ошибка при добавлении комментария',
        type: 'error'
      });
    }
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const getStatusBadge = (review: Review) => {
    if (!review.isVerified) {
      return <span className="status-badge pending">Ожидает модерации</span>;
    } else if (review.isPublished) {
      return <span className="status-badge approved">Одобрен</span>;
    } else {
      return <span className="status-badge rejected">Отклонен</span>;
    }
  };

  const getUserDisplay = (review: Review) => {
    // 🏠 Приоритет: данные из home.mephi (даже для анонимных отзывов)
    if (review.homeMephiFirstName && review.homeMephiLastName) {
      const fullName = `${review.homeMephiLastName} ${review.homeMephiFirstName}`;
      if (review.homeMephiMiddleName) {
        return `${fullName} ${review.homeMephiMiddleName}`;
      }
      return fullName;
    }
    
    // Fallback на обычные данные
    if (review.isAnonymous) {
      return 'Анонимный пользователь';
    } else if (review.user) {
      return review.user.name;
    } else {
      return 'Пользователь';
    }
  };

  const getUserDetails = (review: Review) => {
    const details = [];
    
    // 🏠 Данные из home.mephi (приоритет)
    if (review.homeMephiFaculty) {
      details.push(`Факультет: ${review.homeMephiFaculty}`);
    }
    if (review.homeMephiCourse) {
      details.push(`Курс: ${review.homeMephiCourse}`);
    }
    if (review.homeMephiGroup) {
      details.push(`Группа: ${review.homeMephiGroup}`);
    }
    if (review.homeMephiStudentId) {
      details.push(`Студ. билет: ${review.homeMephiStudentId}`);
    }
    
    // Fallback на обычные данные
    if (details.length === 0 && review.user) {
      if (review.user.faculty) {
        details.push(`Факультет: ${review.user.faculty}`);
      }
      if (review.user.course) {
        details.push(`Курс: ${review.user.course}`);
      }
    }
    
    return details;
  };

  return (
    <div className="admin-reviews">
      <div className="admin-section-header">
        <h2>Модерация отзывов</h2>
        <div className="admin-actions">
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value as any)}
            className="form-input"
            style={{ width: 'auto', marginRight: '10px' }}
          >
            <option value="pending">Ожидают модерации</option>
            <option value="approved">Одобренные</option>
            <option value="rejected">Отклоненные</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Загрузка отзывов...</div>
      ) : (
        <div className="reviews-table">
          <table>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Сообщество</th>
                <th>Рейтинг</th>
                <th>Заголовок</th>
                <th>Содержание</th>
                <th>Комментарий админа</th>
                <th>Дата</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <div className="applicant-info">
                      <div className="applicant-name">
                        {getUserDisplay(review)}
                        {review.isAnonymous && review.homeMephiFirstName && (
                          <span 
                            style={{ 
                              fontSize: '12px', 
                              color: '#666', 
                              marginLeft: '8px',
                              fontStyle: 'italic'
                            }}
                            title="Анонимный отзыв, но данные пользователя видны в админке"
                          >
                            (аноним)
                          </span>
                        )}
                      </div>
                      {review.user && (
                        <div className="applicant-email">{review.user.email}</div>
                      )}
                      {getUserDetails(review).map((detail, index) => (
                        <div 
                          key={index} 
                          className="applicant-detail"
                          style={{ fontSize: '12px', color: '#666' }}
                        >
                          {detail}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div className="community-info">
                      {review.community.name}
                    </div>
                  </td>
                  <td>
                    <div className="rating-cell">
                      <span className="stars">{renderStars(review.rating)}</span>
                      <span className="rating-text">{review.rating}/5</span>
                    </div>
                  </td>
                  <td>
                    <div className="title-cell">
                      {review.title || 'Без заголовка'}
                    </div>
                  </td>
                  <td>
                    <div className="content-cell">
                      {review.content.length > 100 
                        ? `${review.content.substring(0, 100)}...` 
                        : review.content
                      }
                    </div>
                  </td>
                  <td>
                    <div className="admin-comment-cell">
                      {review.adminComment || 'Комментарий не добавлен'}
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(review)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {!review.isVerified ? (
                        <>
                          <button 
                            className="action-btn approve"
                            onClick={() => handleModerate(review.id, 'approve')}
                            title="Одобрить"
                          >
                            ✅
                          </button>
                          <button 
                            className="action-btn reject"
                            onClick={() => handleModerate(review.id, 'reject')}
                            title="Отклонить"
                          >
                            ❌
                          </button>
                        </>
                      ) : (
                        <div className="processed-info">
                          Обработано
                        </div>
                      )}
                      
                      <button 
                        className="action-btn comment"
                        onClick={() => setCommentingReview(commentingReview === review.id ? null : review.id)}
                        title="Добавить комментарий"
                      >
                        💬
                      </button>
                      
                      {/* Кнопка удаления только для администраторов */}
                      {currentUser?.role === 'ADMIN' && (
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDelete(review.id)}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                    
                    {commentingReview === review.id && (
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
                            onClick={() => handleAddComment(review.id)}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Сохранить
                          </button>
                          <button 
                            className="button"
                            onClick={() => {
                              setCommentingReview(null);
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

      {reviews.length === 0 && !loading && (
        <div className="no-data">
          <p>
            {status === 'pending' && 'Нет отзывов, ожидающих модерации'}
            {status === 'approved' && 'Нет одобренных отзывов'}
            {status === 'rejected' && 'Нет отклоненных отзывов'}
          </p>
        </div>
      )}
      
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default AdminReviews; 