import React, { useState, useEffect } from 'react';

interface CommunityRatingProps {
  communityId: string;
  compact?: boolean;
}

// Кэш для рейтингов сообществ
const ratingCache = new Map<string, { rating: number; reviewCount: number; timestamp: number }>();
const CACHE_DURATION = 600000; // 10 минут

const CommunityRating: React.FC<CommunityRatingProps> = ({ communityId, compact = false }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRating();
  }, [communityId]);

  const fetchRating = async () => {
    try {
      // Проверяем кэш
      const cached = ratingCache.get(communityId);
      if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
        setRating(cached.rating);
        setReviewCount(cached.reviewCount);
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/reviews/community/${communityId}/stats`);
      const data = await response.json();
      
      if (data.success) {
        const newRating = data.data.averageRating;
        const newReviewCount = data.data.totalReviews;
        
        setRating(newRating);
        setReviewCount(newReviewCount);
        
        // Сохраняем в кэш
        ratingCache.set(communityId, {
          rating: newRating,
          reviewCount: newReviewCount,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error('Ошибка при загрузке рейтинга:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  if (loading) {
    return (
      <div className="text-gray-400 text-sm">
        {compact ? '...' : 'Загрузка рейтинга...'}
      </div>
    );
  }

  if (rating === null || reviewCount === 0) {
    return (
      <div className="text-gray-400 text-sm">
        {compact ? 'Нет отзывов' : 'Пока нет отзывов'}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-yellow-400 text-xs">
          {renderStars(rating)}
        </span>
        <span className="text-xs text-gray-400">
          ({reviewCount})
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-yellow-400 text-sm">
        {renderStars(rating)}
      </span>
      <span className="text-sm text-gray-400">
        {rating.toFixed(1)} ({reviewCount} отзывов)
      </span>
    </div>
  );
};

export default CommunityRating; 