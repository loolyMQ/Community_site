import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
import { generateGraphData, getConnectedNodes, getNodeColor } from '../utils/graphUtils';
import { useGraphPhysics } from '../hooks/useGraphPhysics';
import { GraphNode, Community } from '../types';
import { useCommunities } from '../hooks/useCommunities';
import CommunityModal from './CommunityModal';
import AddCommunityModal from './AddCommunityModal';
import ContextMenu from './ContextMenu';
import CommunityList from './CommunityList';
import AdminPanel from './AdminPanel';
import Orb from './Orb';
import { debounce } from '../utils/debounce';

const CommunityGraph: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const navigate = useNavigate();
  
  // Загружаем данные сообществ
  const { communities, categories, relationships, loading, error, refresh } = useCommunities();
  
  // Генерируем данные графа на основе загруженных данных (мемоизировано)
  const graphData = useMemo(() => {
    if (communities.length > 0) {
      return generateGraphData(communities, categories, relationships);
    }
    return generateGraphData();
  }, [communities, categories, relationships]);
  
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragDistance, setDragDistance] = useState(0);
  const [wasNodeDragged, setWasNodeDragged] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');


  // Применяем тему к документу
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  

  
  // Функция для обновления данных (для уведомления админки о новых заявках)
  const [dataVersion, setDataVersion] = useState(0);
  
  // Дебаунсированное обновление данных - только раз в 15 секунд для лучшей производительности
  const debouncedRefresh = useMemo(
    () => debounce(() => {
      refresh();
    }, 15000),
    [refresh]
  );
  
  const updateData = useCallback(() => {
    setDataVersion(prev => prev + 1);
    debouncedRefresh(); // Используем дебаунсированное обновление
  }, [debouncedRefresh]);
  
  const { positions, setNodePosition, pinNode, unpinNode } = useGraphPhysics({
    nodes: graphData.nodes,
    edges: graphData.edges,
    config: {
      // Конфигурация с усиленным динамическим отталкиванием категорий
      repulsion: 100000, // Увеличенное базовое отталкивание
      attraction: 1.0, // Умеренное притяжение сообществ к категориям
      damping: 0.85, // Увеличенное затухание для стабильности
      springLength: 150, // Увеличенная длина пружины для большего расстояния
      gravity: 0.003, // Уменьшенная гравитация
      dragSpringBoost: 2.0,
      maxVelocity: 500 // Увеличенная скорость для быстрого расхождения
    }
  });

  // Обработка событий мыши и касаний
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    // Проверяем, кликнули ли мы по узлу
    const clickedNode = findNodeAtPosition(x, y);
    if (clickedNode) {
      setSelectedNode(clickedNode.id);
      pinNode(clickedNode.id);
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setWasNodeDragged(false);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragDistance(0);
    }
  }, [offset, scale, pinNode]);

  // Обработка событий мыши (для обратной совместимости)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handlePointerDown(e as any);
  }, [handlePointerDown]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    // Обновляем hovered node
    const hoveredNode = findNodeAtPosition(x, y);
    setHoveredNode(hoveredNode?.id || null);

    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      setDragDistance(distance);
      
      if (selectedNode) {
        // Перемещаем узел - используем дельту от начальной позиции
        const currentPos = positions.get(selectedNode);
        if (currentPos) {
          const newX = currentPos.x + deltaX / scale;
          const newY = currentPos.y + deltaY / scale;
          setNodePosition(selectedNode, newX, newY);
          // Устанавливаем флаг, что узел был перетаскиваемым
          setWasNodeDragged(true);
        }
        // Обновляем dragStart для узла, чтобы не панорамировать граф
        setDragStart({ x: e.clientX, y: e.clientY });
      } else {
        // Панорамируем граф
        setOffset(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    }
  }, [isDragging, selectedNode, dragStart, offset, scale, setNodePosition, positions]);

  // Обработка событий мыши (для обратной совместимости)
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handlePointerMove(e as any);
  }, [handlePointerMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (selectedNode) {
      unpinNode(selectedNode);
    }
    setSelectedNode(null);
    setDragDistance(0);
    // Сбрасываем флаг перетаскивания узла с небольшой задержкой
    setTimeout(() => setWasNodeDragged(false), 100);
  }, [selectedNode, unpinNode]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    
    // Если это был клик (не перетаскивание)
    if (!isDragging || dragDistance <= 20 && !wasNodeDragged) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;

      const clickedNode = findNodeAtPosition(x, y);
      if (clickedNode && clickedNode.type === 'community') {
        const community = communities.find(c => c.id === clickedNode.id);
        if (community) {
          setSelectedCommunity(community);
          setShowCommunityModal(true);
        }
      }
    }

    // Завершаем перетаскивание
    setIsDragging(false);
    if (selectedNode) {
      unpinNode(selectedNode);
    }
    setSelectedNode(null);
    setDragDistance(0);
    // Сбрасываем флаг перетаскивания узла с небольшой задержкой
    setTimeout(() => setWasNodeDragged(false), 100);
  }, [isDragging, dragDistance, wasNodeDragged, offset, scale, graphData, positions, communities, selectedNode, unpinNode]);

  // Обработка событий мыши (для обратной совместимости)
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Клики обрабатываются через handlePointerUp
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;

    const clickedNode = findNodeAtPosition(x, y);
    if (clickedNode) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        nodeId: clickedNode.id
      });
    }
  }, [offset, scale]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(3, scale * zoomFactor));

    // Масштабируем относительно позиции мыши
    const newOffset = {
      x: mouseX - (mouseX - offset.x) * (newScale / scale),
      y: mouseY - (mouseY - offset.y) * (newScale / scale)
    };

    setScale(newScale);
    setOffset(newOffset);
  }, [scale, offset]);

  // Обработка жестов масштабирования для мобильных устройств
  const [initialDistance, setInitialDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState<number>(1);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches.length === 2) {
      // Два пальца - начало жеста масштабирования
      const distance = Math.sqrt(
        Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) +
        Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2)
      );
      setInitialDistance(distance);
      setInitialScale(scale);
    } else if (e.touches.length === 1) {
      // Одиночное касание - начало перетаскивания
      const touch = e.touches[0];
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (touch.clientX - rect.left - offset.x) / scale;
      const y = (touch.clientY - rect.top - offset.y) / scale;

      const clickedNode = findNodeAtPosition(x, y);
      if (clickedNode) {
        setSelectedNode(clickedNode.id);
        pinNode(clickedNode.id);
        setIsDragging(true);
        setDragStart({ x: touch.clientX, y: touch.clientY });
        setWasNodeDragged(false);
      } else {
        setIsDragging(true);
        setDragStart({ x: touch.clientX, y: touch.clientY });
        setDragDistance(0);
      }
    }
  }, [scale, offset, pinNode, findNodeAtPosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.touches.length === 2 && initialDistance !== null) {
      // Два пальца - масштабирование
      const distance = Math.sqrt(
        Math.pow(e.touches[0].clientX - e.touches[1].clientX, 2) +
        Math.pow(e.touches[0].clientY - e.touches[1].clientY, 2)
      );
      
      const scaleRatio = distance / initialDistance;
      const newScale = Math.max(0.1, Math.min(5, initialScale * scaleRatio));
      
      setScale(newScale);
    } else if (e.touches.length === 1 && isDragging) {
      // Одиночное касание - перетаскивание
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      const deltaY = touch.clientY - dragStart.y;
      
      if (selectedNode) {
        // Перетаскивание узла
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = (touch.clientX - rect.left - offset.x) / scale;
        const y = (touch.clientY - rect.top - offset.y) / scale;
        
        setNodePosition(selectedNode, x, y);
        setWasNodeDragged(true);
      } else {
        // Перетаскивание камеры
        setOffset(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
      }
      
      setDragStart({ x: touch.clientX, y: touch.clientY });
      setDragDistance(prev => prev + Math.sqrt(deltaX * deltaX + deltaY * deltaY));
    }
  }, [initialDistance, initialScale, isDragging, selectedNode, dragStart, offset, scale, setNodePosition]);

  const handleTouchEnd = useCallback(() => {
    // Если это был клик (не перетаскивание)
    if (!isDragging || dragDistance <= 20 && !wasNodeDragged) {
      // Обработка клика по узлу
      if (selectedNode) {
        const community = communities.find(c => c.id === selectedNode);
        if (community) {
          setSelectedCommunity(community);
          setShowCommunityModal(true);
        }
      }
    }
    
    // Сброс состояний
    setInitialDistance(null);
    setIsDragging(false);
    setSelectedNode(null);
    setDragDistance(0);
    setWasNodeDragged(false);
  }, [isDragging, dragDistance, wasNodeDragged, selectedNode, communities]);

  // Поиск узла по позиции - оптимизированный
  const findNodeAtPosition = useCallback((x: number, y: number): GraphNode | null => {
    // Проверяем только узлы в видимой области для оптимизации
    const visibleNodes = graphData.nodes.filter(node => {
      const pos = positions.get(node.id);
      if (!pos) return false;
      
      // Быстрая проверка границ
      const nodeX = pos.x * scale + offset.x;
      const nodeY = pos.y * scale + offset.y;
      const maxSize = node.size * scale * 3;
      
      return nodeX >= -maxSize && nodeX <= window.innerWidth + maxSize &&
             nodeY >= -maxSize && nodeY <= window.innerHeight + maxSize;
    });

    // Проверяем только видимые узлы
    for (let i = visibleNodes.length - 1; i >= 0; i--) {
      const node = visibleNodes[i];
      const pos = positions.get(node.id);
      if (!pos) continue;

      const distance = Math.sqrt(
        Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2)
      );

      if (distance <= node.size * 2.5) {
        return node;
      }
    }
    return null;
  }, [graphData.nodes, positions, scale, offset]);

  // Рендеринг графа
  const renderGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очищаем canvas и закрашиваем фон
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // В светлой теме закрашиваем фон серым
    if (theme === 'light') {
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Применяем трансформации
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Создаем Map для быстрого поиска узлов
    const nodesMap = new Map(graphData.nodes.map(n => [n.id, n]));
    
    // Рисуем рёбра
    graphData.edges.forEach(edge => {
      const sourcePos = positions.get(edge.source);
      const targetPos = positions.get(edge.target);
      
      if (!sourcePos || !targetPos) return;

      const sourceNode = nodesMap.get(edge.source);
      const targetNode = nodesMap.get(edge.target);
      
      if (!sourceNode || !targetNode) return;

      const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;
      
      // Цвет ребра — цвет категории узла-цели (категории)
      const strokeColor = (edge as any).color || (targetNode.type === 'category' ? targetNode.color : '#444444');
      ctx.strokeStyle = strokeColor;
      // Основная категория — толще
      const isMain = Boolean((edge as any).isMain);
      ctx.lineWidth = isHighlighted ? (isMain ? 3 : 2) : (isMain ? 2.2 : 1.2);
      ctx.globalAlpha = isHighlighted ? 0.9 : 0.6;

      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);
      ctx.lineTo(targetPos.x, targetPos.y);
      ctx.stroke();
    });

    // Кэшируем связанные узлы для оптимизации
    const connectedNodes = hoveredNode ? new Set(getConnectedNodes(hoveredNode, graphData.edges)) : new Set();
    
    // Рисуем узлы
    graphData.nodes.forEach(node => {
      const pos = positions.get(node.id);
      if (!pos) return;

      const isHighlighted = hoveredNode === node.id || selectedNode === node.id;
      const isConnected = connectedNodes.has(node.id);

      ctx.globalAlpha = isHighlighted || isConnected ? 1 : 0.7;

      // Рисуем круг узла
      ctx.fillStyle = getNodeColor(node, isHighlighted);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, node.size, 0, 2 * Math.PI);
      ctx.fill();

      // Рисуем обводку для категорий
      if (node.type === 'category') {
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Рисуем текст только для выделенных узлов и категорий
      if (isHighlighted || node.type === 'category') {
        // В светлой теме текст черный, в темной - белый
        ctx.fillStyle = theme === 'light' ? '#000000' : '#ffffff';
        ctx.font = `${node.type === 'category' ? '14px' : '12px'} Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = node.type === 'category' ? node.label : node.label.substring(0, 15);
        ctx.fillText(text, pos.x, pos.y + node.size + 15);
      }
    });

    ctx.restore();
  }, [graphData, positions, hoveredNode, selectedNode, offset, scale, theme]);

  // Анимационный цикл - оптимизированный
  useEffect(() => {
    if (viewMode === 'graph') {
      let animationId: number;
      let lastTime = 0;
      const targetFPS = 60; // Ограничиваем FPS для производительности
      const frameInterval = 1000 / targetFPS;

      const animate = (currentTime: number) => {
        if (currentTime - lastTime >= frameInterval) {
          renderGraph();
          lastTime = currentTime;
        }
        animationId = requestAnimationFrame(animate);
      };
      
      animationId = requestAnimationFrame(animate);
      
      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }
  }, [renderGraph, viewMode]);

  // Обработчики событий
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || viewMode !== 'graph') return;

    canvas.addEventListener('wheel', handleWheel as any);
    return () => {
      canvas.removeEventListener('wheel', handleWheel as any);
    };
  }, [handleWheel, viewMode]);

  // Показываем индикатор загрузки
  if (loading) {
    return (
      <div className="graph-view">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка сообществ...</p>
        </div>
      </div>
    );
  }

  // Показываем ошибку
  if (error) {
    return (
      <div className="graph-view">
        <div className="error-container">
          <h3>Ошибка загрузки данных</h3>
          <p>{error}</p>
          <button onClick={refresh} className="retry-btn">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="graph-view">
      {/* Заголовок с переключателем */}
      <div className="app-header">
        <div className="app-title shiny-text" data-text="Карта студенческих сообществ">Карта студенческих сообществ</div>
        <div className="app-subtitle">Интерактивная визуализация</div>
        
        {/* Переключатель режимов */}
        <div className="view-mode-switcher">
          <button 
            className={`view-mode-btn ${viewMode === 'graph' ? 'active' : ''}`}
            onClick={() => setViewMode('graph')}
          >
            <span className="shiny-text" data-text="🕸️ Граф">🕸️ Граф</span>
          </button>
          <button 
            className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <span className="shiny-text" data-text="📋 Список">📋 Список</span>
          </button>
        </div>

        {/* Переключатель тем */}
        <div className="theme-switcher">
          <button 
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => setTheme('dark')}
          >
            <span className="shiny-text" data-text="🌙 Темная">🌙 Темная</span>
          </button>
          <button 
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => setTheme('light')}
          >
            <span className="shiny-text" data-text="☀️ Светлая">☀️ Светлая</span>
          </button>
        </div>
      </div>

      {/* Панель управления */}
      {viewMode === 'graph' && (
        <div className="control-panel">
          <h3>Управление</h3>
          <div className="control-group">
            <label className="control-label">Масштаб: {Math.round(scale * 100)}%</label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="control-input"
            />
          </div>
          
          <div className="control-group">
            <button 
              className="button"
              onClick={() => {
                setOffset({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
                setScale(1);
              }}
            >
              <span className="shiny-text" data-text="Сбросить вид">Сбросить вид</span>
            </button>
          </div>
          <div className="control-group">
            <button 
              className="button"
              onClick={() => {
                // Сбрасываем позиции всех узлов
                graphData.nodes.forEach((node, index) => {
                  const angle = (index / graphData.nodes.length) * 2 * Math.PI;
                  const radius = 400 + Math.random() * 300;
                  setNodePosition(node.id, 
                    Math.cos(angle) * radius, 
                    Math.sin(angle) * radius
                  );
                });
              }}
            >
              <span className="shiny-text" data-text="Перемешать узлы">Перемешать узлы</span>
            </button>
          </div>
        </div>
      )}

      {/* Кнопка входа в админ-панель */}
      <button 
        className="admin-btn"
        onClick={() => setShowAdminPanel(true)}
        title="Войти в админ-панель"
      >
        <span className="shiny-text" data-text="⚙️ Админ">⚙️ Админ</span>
      </button>

      {/* Информационная панель */}
      {viewMode === 'graph' && (
        <div className="info-panel">
          <h3>Как использовать</h3>
          <div className="info-text">
            <span className="desktop-only">• Перетаскивайте узлы мышью<br/>
            • Используйте колесо мыши для масштабирования<br/></span>
            <span className="mobile-only">• Перетаскивайте узлы пальцем<br/>
            • Используйте два пальца для масштабирования<br/></span>
            • Кликните на сообщество для подробностей<br/>
            • По всем вопросам обращайтесь в <a href="https://t.me/a_attuu" target="_blank" rel="noopener noreferrer">Telegram</a>
          </div>
        </div>
      )}

      {/* Контент в зависимости от режима */}
      {viewMode === 'graph' ? (
        <>
          <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ 
              cursor: isDragging ? 'grabbing' : 'grab',
              position: 'relative',
              zIndex: 10,
              touchAction: 'none' // Отключаем стандартные жесты браузера
            }}
          />
          {theme === 'dark' && (
            <Orb 
              hue={0} 
              hoverIntensity={1.1} 
              rotateOnHover={false}
            />
          )}
        </>
      ) : (
        <CommunityList 
          communities={communities}
          categories={categories}
          onCommunityClick={(community) => {
            setSelectedCommunity(community);
            setShowCommunityModal(true);
          }}
        />
      )}

      {/* Модальные окна */}
      {showCommunityModal && selectedCommunity && (
        <CommunityModal 
          community={selectedCommunity}
          categories={categories}
          onClose={() => {
            setShowCommunityModal(false);
            setSelectedCommunity(null);
          }}
          onDataUpdate={updateData}
        />
      )}

      {showAddModal && (
        <AddCommunityModal 
          categories={categories}
          onClose={() => setShowAddModal(false)}
          onDataUpdate={updateData}
        />
      )}

      {showAdminPanel && (
        <AdminPanel 
          onClose={() => setShowAdminPanel(false)}
          dataVersion={dataVersion}
        />
      )}

      {/* Контекстное меню */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          onClose={() => setContextMenu(null)}
          onAction={(_action) => {
            // Обработка действий контекстного меню
            setContextMenu(null);
          }}
        />
      )}
    </div>
  );
};

export default CommunityGraph; 