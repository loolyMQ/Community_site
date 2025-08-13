import React, { useState } from 'react';
import { apiService } from '../services/api';

interface AdminLoginProps {
  onLogin: (user: { id: string; name: string; role: string }) => void;
  onClose: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiService.login({ email, password });
      
      onLogin({
        id: response.user.id,
        name: response.user.name,
        role: response.user.role
      });
    } catch (error: any) {
      setError(error.message || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setError('');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setError('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal admin-login-modal">
        <div className="modal-header">
          <h2 className="modal-title">Вход в админ-панель</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email администратора</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={handleEmailChange}
              placeholder="admin@university.edu"
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Введите пароль"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="flex gap-8">
            <button 
              type="submit" 
              className="button primary"
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
            <button 
              type="button" 
              className="button" 
              onClick={onClose}
              disabled={isLoading}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin; 