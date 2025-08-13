import React from 'react';

interface GraphSkeletonProps {
  width?: number;
  height?: number;
}

const GraphSkeleton: React.FC<GraphSkeletonProps> = ({ 
  width = 800, 
  height = 600 
}) => {
  return (
    <div 
      className="graph-skeleton"
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Анимированные элементы загрузки */}
      <div className="skeleton-content">
        <div className="skeleton-spinner"></div>
        <div className="skeleton-text">Загрузка графа сообществ...</div>
      </div>
      
      {/* Анимированные точки */}
      <div className="skeleton-dots">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i}
            className="skeleton-dot"
            style={{
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
      
      <style>{`
        .graph-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        
        .skeleton-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          z-index: 2;
        }
        
        .skeleton-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e0e0e0;
          border-top: 4px solid #007bff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .skeleton-text {
          color: #666;
          font-size: 16px;
          font-weight: 500;
        }
        
        .skeleton-dots {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          gap: 8px;
          z-index: 1;
        }
        
        .skeleton-dot {
          width: 8px;
          height: 8px;
          background-color: #007bff;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};

export default GraphSkeleton; 