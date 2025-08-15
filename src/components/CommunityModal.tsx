import React, { useState } from 'react';
import { Community, Category } from '../types';
import CommunityReviews from './CommunityReviews';

interface CommunityModalProps {
  community: Community;
  categories: Category[];
  onClose: () => void;
  onDataUpdate?: () => void;
}

const CommunityModal: React.FC<CommunityModalProps> = ({ community, categories, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');

  const communityCategories = categories.filter(cat => community.categoryIds.includes(cat.id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-community" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{community.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Вкладки */}
        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <span className="shiny-text" data-text="Инфо">Инфо</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <span className="shiny-text" data-text="Отзывы">Отзывы</span>
          </button>
        </div>

        {/* Содержимое вкладок */}
        <div className="modal-content">
          {activeTab === 'info' && (
            <div>
              <div className="form-group">
                <label className="form-label">Описание</label>
                <p style={{ color: '#cccccc', lineHeight: '1.5' }}>
                  {community.description}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Категории</label>
                <div className="flex gap-8">
                  {communityCategories.map(category => (
                    <span 
                      key={category.id}
                      style={{
                        background: category.color,
                        color: '#ffffff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}
                    >
                      {category.icon} {category.name}
                    </span>
                  ))}
                </div>
              </div>

              {community.leader && (
                <div className="form-group">
                  <label className="form-label">Руководитель</label>
                  <div style={{ color: '#cccccc' }}>
                    <p>Имя: {community.leader.name}</p>
                    {community.leader.social && (
                      <p>
                        Контакты: 
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
                              style={{ color: '#3B82F6', textDecoration: 'underline', marginLeft: '4px', marginRight: '8px' }}
                            >
                              {displayName}
                            </a>
                          );
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Соцсеть сообщества</label>
                <div style={{ color: '#cccccc' }}>
                  {community.contacts?.social && (
                    <p>
                      Соцсеть: 
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
                            style={{ color: '#3B82F6', textDecoration: 'underline', marginLeft: '4px', marginRight: '8px' }}
                          >
                            {displayName}
                          </a>
                        );
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Количество участников скрыто по требованию */}

              {community.news.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Последние новости</label>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {community.news.map(news => (
                      <div key={news.id} style={{ marginBottom: '12px', padding: '8px', background: '#333333', borderRadius: '4px' }}>
                        <h4 style={{ color: '#ffffff', marginBottom: '4px' }}>{news.title}</h4>
                        <p style={{ color: '#cccccc', fontSize: '12px', marginBottom: '4px' }}>
                          {new Date(news.date).toLocaleDateString('ru-RU')} • {news.author}
                        </p>
                        <p style={{ color: '#cccccc', fontSize: '12px' }}>{news.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <CommunityReviews communityId={community.id} />
          )}


        </div>
      </div>
    </div>
  );
};

export default CommunityModal; 