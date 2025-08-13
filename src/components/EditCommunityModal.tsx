import React, { useEffect, useState } from 'react';
import { Community, Category } from '../types';
import { apiService } from '../services/api';

interface EditCommunityModalProps {
  community: Community;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

const EditCommunityModal: React.FC<EditCommunityModalProps> = ({ community, categories, onClose, onSaved }) => {
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description);
  const [mainCategoryId, setMainCategoryId] = useState<string | undefined>(community.mainCategoryId || community.categoryIds[0]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(community.categoryIds);
  const [leaderName, setLeaderName] = useState(community.leader?.name || '');
  const [leaderSocial, setLeaderSocial] = useState(community.leader?.social || '');
  const [communitySocial, setCommunitySocial] = useState(community.contacts?.social || '');
  const [isOfficial, setIsOfficial] = useState<boolean>(community.isOfficial);
  const [saving, setSaving] = useState(false);

  // Обновляем состояние при изменении данных сообщества
  useEffect(() => {
    setName(community.name);
    setDescription(community.description);
    setMainCategoryId(community.mainCategoryId || community.categoryIds[0]);
    setSelectedCategoryIds(community.categoryIds);
    setLeaderName(community.leader?.name || '');
    setLeaderSocial(community.leader?.social || '');
    setCommunitySocial(community.contacts?.social || '');
    setIsOfficial(community.isOfficial);
  }, [community]);

  useEffect(() => {
    if (!selectedCategoryIds.includes(mainCategoryId || '')) {
      if (mainCategoryId) setSelectedCategoryIds(prev => Array.from(new Set([mainCategoryId!, ...prev])));
    }
  }, [mainCategoryId]);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      alert('Название и описание обязательны');
      return;
    }
    if (!mainCategoryId) {
      alert('Выберите основную категорию');
      return;
    }
    setSaving(true);
    try {
      const updateData: any = {
        name,
        description,
        isOfficial,
        mainCategoryId,
        categoryIds: Array.from(new Set([mainCategoryId, ...selectedCategoryIds])),
        contacts: { social: communitySocial }
      };

      // Всегда отправляем данные руководителя, даже если они пустые
      updateData.leader = { 
        name: leaderName.trim() || '', 
        social: leaderSocial.trim() || '' 
      };

      console.log('Sending update data:', updateData);
      console.log('Community social value:', communitySocial);
      console.log('Contacts object:', updateData.contacts);
      console.log('Leader social value:', leaderSocial);
      console.log('Leader object:', updateData.leader);
      await apiService.updateCommunity(community.id, updateData);
      
      console.log('Community updated successfully, calling onSaved...');
      // Вызываем обновление данных сразу после успешного сохранения
      onSaved();
      
      console.log('Closing modal...');
      onClose();
    } catch (e) {
      console.error(e);
      alert('Ошибка при сохранении изменений');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Редактировать сообщество</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Название *</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Описание *</label>
            <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Основная категория *</label>
            <select className="form-input" value={mainCategoryId} onChange={(e) => setMainCategoryId(e.target.value)} required>
              <option value="" disabled>Выберите основную категорию</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Доп. категории</label>
            <div className="categories-checkboxes" style={{ maxHeight: 180, overflowY: 'auto' }}>
              {categories.map(c => (
                <label key={c.id} className="category-checkbox" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <input type="checkbox" checked={selectedCategoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                  <span>{c.icon} {c.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Руководитель</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input 
                className="form-input" 
                placeholder="Имя (необязательно)" 
                value={leaderName} 
                onChange={(e) => setLeaderName(e.target.value)} 
              />
              <input 
                className="form-input" 
                placeholder="Ссылки руководителя (через запятую)" 
                value={leaderSocial} 
                onChange={(e) => {
                  console.log('Leader social input changed:', e.target.value);
                  setLeaderSocial(e.target.value);
                }} 
              />
            </div>
            <div className="text-xs" style={{ color: '#888', marginTop: '4px' }}>
              ⚠️ Внимание: Введите только нужные контакты. Старые контакты будут полностью заменены.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ссылка на соцсеть сообщества</label>
            <input 
              className="form-input" 
              placeholder="Ссылки сообщества (через запятую)" 
              value={communitySocial} 
              onChange={(e) => {
                console.log('Input changed:', e.target.value);
                setCommunitySocial(e.target.value);
              }} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <input type="checkbox" checked={isOfficial} onChange={(e) => setIsOfficial(e.target.checked)} /> Официальное
            </label>
          </div>

          <div className="flex gap-8">
            <button type="submit" className="button primary" disabled={saving}>Сохранить</button>
            <button type="button" className="button" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCommunityModal;

