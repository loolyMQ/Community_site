import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  onClose: () => void;
  onAction: (action: string) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, nodeId: _nodeId, onClose, onAction }) => {
  const handleAction = (action: string) => {
    onAction(action);
    onClose();
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{ background: 'transparent' }}
    >
      <div 
        style={{
          position: 'fixed',
          left: x,
          top: y,
          background: '#2a2a2a',
          border: '1px solid #444444',
          borderRadius: '4px',
          padding: '8px 0',
          minWidth: '150px',
          zIndex: 1001,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="button"
          style={{
            width: '100%',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            padding: '8px 16px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onClick={() => handleAction('view')}
        >
          👁️ Просмотреть
        </button>
        
        <button
          className="button"
          style={{
            width: '100%',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            padding: '8px 16px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onClick={() => handleAction('edit')}
        >
          ✏️ Редактировать
        </button>
        
        <button
          className="button"
          style={{
            width: '100%',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            padding: '8px 16px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onClick={() => handleAction('delete')}
        >
          🗑️ Удалить
        </button>
        
        <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #444444' }} />
        
        <button
          className="button"
          style={{
            width: '100%',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            padding: '8px 16px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          onClick={() => handleAction('center')}
        >
          🎯 Центрировать
        </button>
      </div>
    </div>
  );
};

export default ContextMenu; 