import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Review {
  id: string;
  userId?: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

interface Community {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  categoryIds: string[];
  isOfficial: boolean;
  currentMembers: number;
  maxMembers?: number;
  logo?: string;
  email?: string;
  phone?: string;
  location?: string;
  website?: string;
  leader?: {
    name: string;
    email?: string;
    phone?: string;
    social?: string;
  };
  contacts?: {
    email?: string;
    phone?: string;
    social?: string;
  };
}

// Кэш для данных сообществ
const communityDetailCache = new Map<string, { 
  community: Community; 
  reviews: Review[]; 
  stats: any; 
  timestamp: number 
}>();
const CACHE_DURATION = 600000; // 10 минут

const CommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [community, setCommunity] = useState<Community | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: {} as Record<string, number>
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Проверяем кэш
        if (id) {
          const cached = communityDetailCache.get(id);
          if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            setCommunity(cached.community);
            setReviews(cached.reviews);
            setStats(cached.stats);
            setLoading(false);
            return;
          }
        }

        // Загружаем данные сообщества
        const communityResponse = await fetch(`http://localhost:3001/api/communities/${id}`);
        if (communityResponse.ok) {
          const communityData = await communityResponse.json();
          setCommunity(communityData.data);
        }

        // Загружаем отзывы
        const reviewsResponse = await fetch(`http://localhost:3001/api/reviews/community/${id}`);
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          setReviews(reviewsData.data || []);
        }

        // Загружаем статистику
        const statsResponse = await fetch(`http://localhost:3001/api/reviews/community/${id}/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        // Используем тестовые данные
        setCommunity({
          id: id || '',
          name: 'Тестовое сообщество',
          description: 'Описание тестового сообщества',
          categoryIds: ['test'],
          isOfficial: true,
          currentMembers: 25,
          maxMembers: 50,
          email: 'test@example.com',
          location: 'Главный корпус'
        });
        setReviews([
          {
            id: '1',
            rating: 5,
            title: 'Отличное сообщество!',
            content: 'Очень доволен участием в этом сообществе.',
            createdAt: '2024-01-15T10:00:00Z',
            user: { name: 'Алексей Петров' }
          }
        ]);
        setStats({
          totalReviews: 1,
          averageRating: 5,
          ratingDistribution: { '5': 1 }
        });
      } finally {
        setLoading(false);
      }

      // Сохраняем в кэш если данные загружены успешно
      if (id && community && reviews.length > 0) {
        communityDetailCache.set(id, {
          community,
          reviews,
          stats,
          timestamp: Date.now()
        });
      }
    };

    fetchData();
  }, [id]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? 'filled' : 'empty'}`}>
          {i <= rating ? '⭐' : '☆'}
        </span>
      );
    }
    return stars;
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
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Загрузка информации о сообществе...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="error-page">
        <h2>Сообщество не найдено</h2>
        <p>Запрашиваемое сообщество не существует или было удалено.</p>
        <Link to="/" className="btn btn-primary"><span className="shiny-text" data-text="Вернуться на главную">Вернуться на главную</span></Link>
      </div>
    );
  }

  return (
    <div className="community-detail">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Главная</Link>
          <span className="separator">/</span>
          <span>Сообщество</span>
        </nav>

        {/* Header */}
        <div className="community-header">
          <div className="community-info">
            <div className="community-logo">
              {community.logo ? (
                <img src={community.logo} alt={community.name} />
              ) : (
                <div className="community-logo-placeholder">
                  {community.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="community-details">
              <h1>{community.name}</h1>
              <div className="community-meta">
                <span className={`badge ${community.isOfficial ? 'badge-success' : 'badge-warning'}`}>
                  {community.isOfficial ? 'Официальное' : 'Студенческое'}
                </span>
                <span className="members-count">
                  {community.currentMembers}
                  {community.maxMembers && `/${community.maxMembers}`} участников
                </span>
              </div>
              <div className="community-rating">
                <div className="stars">
                  {renderStars(Math.round(stats.averageRating))}
                </div>
                <span className="rating-text">
                  {stats.averageRating.toFixed(1)} ({stats.totalReviews} отзывов)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="community-content">
          <div className="content-grid">
            {/* Основная информация */}
            <div className="main-content">
              <div className="card">
                <div className="card-header">
                  <h2 className="shiny-text" data-text="О сообществе">О сообществе</h2>
                </div>
                <p className="community-description">{community.description}</p>
              </div>

              {/* Отзывы */}
              <div className="card">
                <div className="card-header">
                  <h2 className="shiny-text" data-text="Отзывы участников">Отзывы участников</h2>
                  <span className="reviews-count">{stats.totalReviews} отзывов</span>
                </div>
                
                {stats.totalReviews > 0 && (
                  <div className="rating-summary">
                    <div className="average-rating">
                      <div className="rating-number">{stats.averageRating.toFixed(1)}</div>
                      <div className="stars">{renderStars(Math.round(stats.averageRating))}</div>
                      <div className="total-reviews">на основе {stats.totalReviews} отзывов</div>
                    </div>
                    <div className="rating-distribution">
                      {[5, 4, 3, 2, 1].map(rating => (
                        <div key={rating} className="rating-bar">
                          <span className="rating-label">{rating}⭐</span>
                          <div className="rating-progress">
                            <div 
                              className="rating-fill"
                              style={{ 
                                width: `${stats.totalReviews > 0 ? (stats.ratingDistribution[rating] || 0) / stats.totalReviews * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                          <span className="rating-count">{stats.ratingDistribution[rating] || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="reviews-list">
                  {reviews.length > 0 ? (
                    reviews.map(review => (
                      <div key={review.id} className="review-item">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <div className="reviewer-avatar">
                              {review.user?.avatar ? (
                                <img src={review.user.avatar} alt={review.user.name} />
                              ) : (
                                <div className="avatar-placeholder">
                                  {review.user?.name.charAt(0) || 'А'}
                                </div>
                              )}
                            </div>
                            <div className="reviewer-details">
                              <div className="reviewer-name">{review.user?.name || 'Аноним'}</div>
                              <div className="review-date">{formatDate(review.createdAt)}</div>
                            </div>
                          </div>
                          <div className="review-rating">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <div className="review-content">
                          <h4 className="review-title">{review.title}</h4>
                          <p className="review-text">{review.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-reviews">
                      <p>Пока нет отзывов о этом сообществе.</p>
                      <p>Будьте первым, кто оставит отзыв!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Боковая панель */}
            <div className="sidebar">
              {/* Контактная информация */}
              <div className="card">
                <div className="card-header">
                  <h3 className="shiny-text" data-text="Контактная информация">Контактная информация</h3>
                </div>
                <div className="contact-info">
                  {community.email && (
                    <div className="contact-item">
                      <span className="contact-label">Email:</span>
                      <a href={`mailto:${community.email}`} className="contact-value">
                        {community.email}
                      </a>
                    </div>
                  )}
                  {community.phone && (
                    <div className="contact-item">
                      <span className="contact-label">Телефон:</span>
                      <a href={`tel:${community.phone}`} className="contact-value">
                        {community.phone}
                      </a>
                    </div>
                  )}
                  {community.location && (
                    <div className="contact-item">
                      <span className="contact-label">Место встреч:</span>
                      <span className="contact-value">{community.location}</span>
                    </div>
                  )}
                  {community.website && (
                    <div className="contact-item">
                      <span className="contact-label">Веб-сайт:</span>
                      <a href={community.website} target="_blank" rel="noopener noreferrer" className="contact-value">
                        {community.website}
                      </a>
                    </div>
                  )}
                  {community.contacts?.social && (
                    <div className="contact-item">
                      <span className="contact-label">Контакты:</span>
                      <div className="contact-value">
                        {community.contacts.social.split(', ').map((link, index) => {
                          const cleanLink = link.trim();
                          let displayName = 'Ссылка';
                          if (cleanLink.includes('t.me')) displayName = 'Telegram';
                          else if (cleanLink.includes('vk.com')) displayName = 'VK';
                          else if (cleanLink.includes('mailto:')) displayName = 'Email';
                          else if (cleanLink.includes('tel:')) displayName = 'Телефон';
                          else if (cleanLink.includes('http')) displayName = 'Сайт';
                          
                          return (
                            <a 
                              key={index}
                              href={cleanLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="contact-value"
                              style={{ marginRight: '8px' }}
                            >
                              {displayName}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Информация о руководителе */}
              {community.leader && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="shiny-text" data-text="Руководитель">Руководитель</h3>
                  </div>
                  <div className="contact-info">
                    <div className="contact-item">
                      <span className="contact-label">Имя:</span>
                      <span className="contact-value">{community.leader.name}</span>
                    </div>
                    {community.leader.social && (
                      <div className="contact-item">
                        <span className="contact-label">Контакты:</span>
                        <div className="contact-value">
                          {community.leader.social.split(', ').map((link, index) => {
                            const cleanLink = link.trim();
                            let displayName = 'Ссылка';
                            if (cleanLink.includes('t.me')) displayName = 'Telegram';
                            else if (cleanLink.includes('vk.com')) displayName = 'VK';
                            else if (cleanLink.includes('mailto:')) displayName = 'Email';
                            else if (cleanLink.includes('tel:')) displayName = 'Телефон';
                            
                            return (
                              <a 
                                key={index}
                                href={cleanLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="contact-value"
                                style={{ marginRight: '8px' }}
                              >
                                {displayName}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Действия */}
              <div className="card">
                <div className="card-header">
                  <h3 className="shiny-text" data-text="Действия">Действия</h3>
                </div>
                <div className="action-buttons">
                  <button className="btn btn-primary full-width shiny-btn">
                    <span className="shiny-text" data-text="Присоединиться к сообществу">Присоединиться к сообществу</span>
                  </button>
                  {community.leader?.social && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {community.leader.social.split(', ').map((link, index) => {
                        const cleanLink = link.trim();
                        let displayName = 'Связаться';
                        if (cleanLink.includes('t.me')) displayName = 'Telegram';
                        else if (cleanLink.includes('vk.com')) displayName = 'VK';
                        else if (cleanLink.includes('mailto:')) displayName = 'Email';
                        else if (cleanLink.includes('tel:')) displayName = 'Телефон';
                        
                        return (
                          <a 
                            key={index}
                            href={cleanLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-secondary full-width shiny-btn"
                            style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}
                          >
                            <span className="shiny-text" data-text={`Связаться через ${displayName}`}>
                              {displayName}
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                  <button className="btn btn-secondary full-width shiny-btn">
                    <span className="shiny-text" data-text="Оставить отзыв">Оставить отзыв</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetail;
