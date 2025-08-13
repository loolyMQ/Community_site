import React, { useState } from 'react';
import { Community, Category } from '../types';
import CommunityRating from './CommunityRating';

interface CommunityListProps {
  communities: Community[];
  categories: Category[];
  onCommunityClick: (community: Community) => void;
}

const CommunityList: React.FC<CommunityListProps> = ({ communities, categories, onCommunityClick }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Группируем сообщества по главной категории с поиском
  const communitiesByCategory = categories.map(category => ({
    category,
    communities: communities.filter(community => 
      community.mainCategoryId === category.id &&
      (searchQuery === '' || 
       community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       community.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(group => group.communities.length > 0);

  // Фильтруем по выбранной категории
  const filteredGroups = selectedCategory 
    ? communitiesByCategory.filter(group => group.category.id === selectedCategory)
    : communitiesByCategory;

  return (
    <div className="community-list">
      {/* Поиск по названию */}
      <div className="search-section mb-6">
        <h3 className="shiny-text mb-3" data-text="Поиск сообществ">Поиск сообществ</h3>
        <div className="search-container">
          <input
            type="text"
            placeholder="Введите название или описание сообщества..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="clear-search-btn"
              title="Очистить поиск"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Фильтр по главным категориям */}
      <div className="category-filter">
        <h3 className="shiny-text" data-text="Фильтр по главным категориям">Фильтр по главным категориям</h3>
        <div className="category-buttons">
          <button 
            className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            <span className="shiny-text" data-text="Все категории">Все категории</span>
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
              style={{ borderColor: category.color }}
            >
              <span className="shiny-text" data-text={`${category.icon} ${category.name}`}>{category.icon} {category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Список сообществ */}
      <div className="communities-container">
        {filteredGroups.map(group => (
          <div key={group.category.id} className="category-section">
            <div 
              className="category-header"
              style={{ borderLeftColor: group.category.color }}
            >
              <h2 className="shiny-text" data-text={`${group.category.icon} ${group.category.name}`}>{group.category.icon} {group.category.name}</h2>
              <p className="category-description">{group.category.description}</p>
              <span className="community-count">
                {group.communities.length} сообществ (главная категория)
              </span>
            </div>

            <div className="communities-grid">
              {group.communities.map(community => (
                <div 
                  key={community.id} 
                  className="community-card"
                  onClick={() => onCommunityClick(community)}
                >
                  <div className="community-header">
                    <h3 className="community-name">{community.name}</h3>
                    <div className="flex items-center gap-4">
                      <CommunityRating communityId={community.id} compact={true} />
                    </div>
                  </div>
                  
                  <p className="community-description">
                    {community.description}
                  </p>
                  
                  <div className="community-leader">
                    <strong>Руководитель:</strong> {community.leader.name}
                  </div>
                  
                  <div className="community-contacts">
                    <strong>Контакты:</strong> {community.contacts.email}
                  </div>
                  
                  {community.news.length > 0 && (
                    <div className="community-news">
                      <strong>Последние новости:</strong> {community.news.length} записей
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="no-communities">
          <h3>Сообщества не найдены</h3>
          <p>Попробуйте выбрать другую категорию или добавьте новое сообщество.</p>
        </div>
      )}
    </div>
  );
};

export default CommunityList; 