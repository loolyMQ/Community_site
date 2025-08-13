import React, { useEffect } from 'react';

interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ 
  message, 
  type = 'info', 
  onClose, 
  duration = 3000 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'notification-success';
      case 'error':
        return 'notification-error';
      default:
        return 'notification-info';
    }
  };

  return (
    <div className="notification-container animate-fade-in">
      <div className={`notification ${getBgColor()}`}>
        <div className="notification-content">
          <span className="notification-icon">{getIcon()}</span>
          <span className="notification-message">{message}</span>
          <button
            onClick={onClose}
            className="notification-close"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notification; 