import React, { useState, useEffect } from 'react';
import { homeMephiService, ENABLE_HOME_MEPHI_INTEGRATION } from '../services/homeMephiService';

interface AddReviewFormProps {
  communityId: string;
  onSubmit: (reviewData: ReviewFormData) => void;
  onCancel: () => void;
}

interface ReviewFormData {
  rating: number;
  title?: string;
  content: string;
  isAnonymous: boolean;
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

const AddReviewForm: React.FC<AddReviewFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 5,
    title: '',
    content: '',
    isAnonymous: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [homeMephiUser, setHomeMephiUser] = useState<any>(null);
  const [showHomeMephiInfo, setShowHomeMephiInfo] = useState(false);

  // 🏠 Загрузка данных пользователя из home.mephi (заглушка)
  useEffect(() => {
    const loadHomeMephiUser = async () => {
      if (ENABLE_HOME_MEPHI_INTEGRATION) {
        try {
          // TODO: Реальная интеграция с home.mephi
          const mockUser = await homeMephiService.getUserInfo('mock-token');
          if (mockUser.success && mockUser.user) {
            setHomeMephiUser(mockUser.user);
            setShowHomeMephiInfo(true);
          }
        } catch (error) {
          console.log('Home.mephi интеграция недоступна:', error);
        }
      }
    };

    loadHomeMephiUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      setError('Пожалуйста, напишите отзыв');
      return;
    }

    if (formData.content.trim().length < 10) {
      setError('Отзыв должен содержать минимум 10 символов');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 🏠 Добавляем данные home.mephi к форме
      const reviewDataWithHomeMephi = {
        ...formData,
        ...(homeMephiUser && {
          homeMephiUserId: homeMephiUser.id,
          homeMephiFirstName: homeMephiUser.firstName,
          homeMephiLastName: homeMephiUser.lastName,
          homeMephiMiddleName: homeMephiUser.middleName,
          homeMephiFaculty: homeMephiUser.faculty,
          homeMephiCourse: homeMephiUser.course,
          homeMephiGroup: homeMephiUser.group,
          homeMephiStudentId: homeMephiUser.studentId,
        })
      };

      await onSubmit(reviewDataWithHomeMephi);
    } catch (err) {
      setError('Ошибка при отправке отзыва');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
            className="text-2xl cursor-pointer transition-colors"
            style={{ 
              color: star <= rating ? '#4a9eff' : '#666666',
              fontSize: '24px'
            }}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-group">
        <label className="form-label">Ваша оценка</label>
        <div className="flex items-center gap-2">
          {renderStars(formData.rating)}
          <span className="text-sm text-gray-400 ml-2">
            {formData.rating}/5
          </span>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Заголовок (необязательно)</label>
        <input
          type="text"
          className="form-input"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Краткий заголовок отзыва..."
          maxLength={100}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Ваш отзыв</label>
        <textarea
          className="form-textarea"
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Расскажите о вашем опыте с этим сообществом..."
          required
          minLength={10}
          maxLength={1000}
          rows={4}
        />
        <div className="text-xs text-gray-400 mt-1">
          {formData.content.length}/1000 символов
        </div>
      </div>

      {/* 🏠 Информация о home.mephi интеграции */}
      {showHomeMephiInfo && homeMephiUser && (
        <div className="form-group">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
            <div className="text-sm text-blue-300 mb-2">
              🏠 Данные из home.mephi:
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <div>{homeMephiUser.firstName} {homeMephiUser.lastName} {homeMephiUser.middleName}</div>
              {homeMephiUser.faculty && <div>Факультет: {homeMephiUser.faculty}</div>}
              {homeMephiUser.course && <div>Курс: {homeMephiUser.course}</div>}
              {homeMephiUser.group && <div>Группа: {homeMephiUser.group}</div>}
            </div>
          </div>
        </div>
      )}

      <div className="form-group">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isAnonymous}
            onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
            className="w-4 h-4"
          />
          <span className="text-sm text-gray-300">
            Оставить отзыв анонимно
            {showHomeMephiInfo && (
              <span className="text-xs text-gray-500 ml-1">
                (в админке будет видно ваше имя)
              </span>
            )}
          </span>
        </label>
        {formData.isAnonymous && showHomeMephiInfo && (
          <div className="text-xs text-yellow-400 mt-1">
            ⚠️ Отзыв будет анонимным для других пользователей, но администраторы увидят ваше полное имя
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded p-2">
          {error}
        </div>
      )}

      <div className="flex gap-8">
        <button 
          type="submit" 
          className="button primary"
          disabled={loading}
        >
          {loading ? 'Отправка...' : 'Отправить отзыв'}
        </button>
        <button 
          type="button" 
          className="button"
          onClick={onCancel}
          disabled={loading}
        >
          Отмена
        </button>
      </div>
    </form>
  );
};

export default AddReviewForm; 