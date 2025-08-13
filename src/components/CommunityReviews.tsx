import React, { useState, useEffect } from 'react';
import { Review } from '../types';
import AddReviewForm from './AddReviewForm';
import Notification from './Notification';

interface CommunityReviewsProps {
  communityId: string;
}

// Кэш для отзывов сообществ
const reviewsCache = new Map<string, { reviews: Review[]; timestamp: number }>();
const CACHE_DURATION = 600000; // 10 минут

const CommunityReviews: React.FC<CommunityReviewsProps> = ({ communityId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [communityId]);

  const fetchReviews = async () => {
    try {
      // Проверяем кэш
      const cached = reviewsCache.get(communityId);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        setReviews(cached.reviews);
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:3001/api/reviews/community/${communityId}`);
      const data = await response.json();
      
      if (data.success) {
        const newReviews = data.data.reviews;
        setReviews(newReviews);
        
        // Сохраняем в кэш
        reviewsCache.set(communityId, {
          reviews: newReviews,
          timestamp: Date.now()
        });
      } else {
        setError('Ошибка при загрузке отзывов');
      }
    } catch (err) {
      setError('Ошибка при загрузке отзывов');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async (reviewData: {
    rating: number;
    title?: string;
    content: string;
    isAnonymous: boolean;
  }) => {
    setSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3001/api/reviews/community/${communityId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();

      if (data.success) {
        setNotification({
          message: 'Отзыв отправлен на модерацию! Спасибо за ваш отзыв.',
          type: 'success'
        });
        setShowAddForm(false);
        // Обновляем список отзывов
        await fetchReviews();
      } else {
        throw new Error(data.message || 'Ошибка при отправке отзыва');
      }
    } catch (err) {
      setNotification({
        message: 'Ошибка при отправке отзыва. Попробуйте еще раз.',
        type: 'error'
      });
      console.error('Error submitting review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-400">Загрузка отзывов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-center py-8">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="form-group">
        <div className="flex justify-between items-center mb-4">
          <label className="form-label">Отзывы ({reviews.length})</label>
          <button
            onClick={() => setShowAddForm(true)}
            className="button"
            disabled={submitting}
          >
            Добавить отзыв
          </button>
        </div>
        
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-800/50 border border-gray-600 rounded-lg">
            <h3 className="text-white font-medium mb-4">Новый отзыв</h3>
            <AddReviewForm
              communityId={communityId}
              onSubmit={handleAddReview}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}
        
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Пока нет отзывов для этого сообщества
            {!showAddForm && (
              <div className="mt-4">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="button"
                >
                  Будьте первым!
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="scroll-list">
            {reviews.map((review) => (
              <div key={review.id} className="item">
                <div className="flex justify-between items-start mb-0.5 flex-wrap">
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="text-yellow-400 text-xs">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-xs text-gray-400">
                      {review.rating}/5
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                
                <div className="mb-0.5">
                  <span className="text-xs text-gray-400">
                    {review.isAnonymous ? 'Анонимный пользователь' : review.user?.name || 'Пользователь'}
                  </span>
                  {review.isVerified && (
                    <span className="ml-1 text-xs bg-green-600 text-white px-1 py-0.5 rounded">
                      ✓ Проверен
                    </span>
                  )}
                </div>
                
                {review.title && (
                  <h4 className="font-medium text-white mb-0.5 break-words text-xs">{review.title}</h4>
                )}
                
                <p className="text-gray-300 text-xs leading-tight break-words">
                  {review.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
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

export default CommunityReviews; 