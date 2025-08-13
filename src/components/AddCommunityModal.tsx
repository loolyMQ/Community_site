import React, { useState } from 'react';
import { CommunityFormData, Category } from '../types';

interface AddCommunityModalProps {
  categories: Category[];
  onClose: () => void;
  onDataUpdate?: () => void;
}

const AddCommunityModal: React.FC<AddCommunityModalProps> = ({ categories, onClose, onDataUpdate }) => {
  const [formData, setFormData] = useState<CommunityFormData>({
    name: '',
    description: '',
    categoryIds: [],
    leader: {
      name: '',
      email: '',
      phone: '',
      social: ''
    },
    contacts: {
      email: '',
      phone: '',
      social: ''
    },
    isOfficial: false
  });
  const [mainCategoryId, setMainCategoryId] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalCategoryIds = Array.from(new Set([...(mainCategoryId ? [mainCategoryId] : []), ...formData.categoryIds]));
      const payload = {
        name: formData.name,
        description: formData.description,
        categoryIds: finalCategoryIds,
        mainCategoryId: mainCategoryId || null,
        isOfficial: formData.isOfficial,
        leader: {
          name: formData.leader.name,
          social: formData.leader.social
        },
        contacts: {
          social: formData.contacts.social
        }
      };
      const { apiService } = await import('../services/api');
      await apiService.createCommunity(payload);
      alert('Сообщество добавлено!');
      if (onDataUpdate) onDataUpdate();
      onClose();
    } catch (err) {
      alert('Ошибка при создании сообщества');
      console.error(err);
    }
  };

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        categoryIds: [...prev.categoryIds, categoryId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        categoryIds: prev.categoryIds.filter(id => id !== categoryId)
      }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Добавить новое сообщество</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Название сообщества *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Описание *</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Основная категория *</label>
            <select
              className="form-input"
              value={mainCategoryId}
              onChange={(e) => setMainCategoryId(e.target.value)}
              required
            >
              <option value="" disabled>Выберите основную категорию</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Дополнительные категории</label>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #555555', borderRadius: '4px', padding: '8px' }}>
              {categories.map(category => (
                <label key={category.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.categoryIds.includes(category.id)}
                    onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ color: '#cccccc', fontSize: '14px' }}>
                    {category.icon} {category.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Руководитель</label>
            <input
              type="text"
              className="form-input"
              placeholder="Имя руководителя (необязательно)"
              value={formData.leader.name}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                leader: { ...prev.leader, name: e.target.value } 
              }))}
            />
            <input
              type="text"
              className="form-input"
              style={{ marginTop: '8px' }}
              placeholder="Ссылки руководителя (через запятую)"
              value={formData.leader.social}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                leader: { ...prev.leader, social: e.target.value } 
              }))}
            />
            <div className="text-xs" style={{ color: '#888', marginTop: '4px' }}>
              Все поля руководителя необязательны. Можно указать несколько ссылок через запятую: VK, Telegram, телефон, сайт
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ссылка на соцсеть сообщества</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ссылки сообщества (через запятую)"
              value={formData.contacts.social}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                contacts: { ...prev.contacts, social: e.target.value } 
              }))}
            />
            <div className="text-xs" style={{ color: '#888', marginTop: '4px' }}>
              Можно указать несколько ссылок через запятую: VK, Telegram, Email, телефон, сайт
            </div>
          </div>

          <div className="flex gap-8">
            <button type="submit" className="button primary">
              Создать сообщество
            </button>
            <button type="button" className="button" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCommunityModal; 