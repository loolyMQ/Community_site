import { useState, useEffect, useRef, useCallback } from 'react';
import { GraphNode, GraphEdge } from '../types';

interface PhysicsConfig {
  // Сила отталкивания по Кулону
  repulsion: number;
  // Сила пружины по Гуку
  attraction: number;
  // Длина покоя пружины
  springLength: number;
  // Затухание скорости
  damping: number;
  // Сила стремления к центру
  gravity: number;
  // Максимальная скорость узлов (стабилизация)
  maxVelocity?: number;
  // Множитель силы пружины для рёбер, связанных с перетаскиваемым узлом
  dragSpringBoost?: number;
}

interface UseGraphPhysicsProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  config?: Partial<PhysicsConfig>;
}

export function useGraphPhysics({ nodes, edges, config }: UseGraphPhysicsProps) {
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const velocitiesRef = useRef<Map<string, { vx: number; vy: number }>>(new Map());
  const pinnedRef = useRef<Set<string>>(new Set());
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const defaultConfig: PhysicsConfig = {
    repulsion: 15000, // Увеличиваем отталкивание
    attraction: 0.8,
    springLength: 150,
    damping: 0.9,
    gravity: 0.02, // Уменьшаем гравитацию
    maxVelocity: 300, // px/s
    dragSpringBoost: 2.0
  };

  const physicsConfig: PhysicsConfig = { ...defaultConfig, ...config } as PhysicsConfig;

  // Инициализация позиций и скоростей
  useEffect(() => {
    const newPositions = new Map<string, { x: number; y: number }>(positionsRef.current);
    const newVelocities = new Map<string, { vx: number; vy: number }>(velocitiesRef.current);

    nodes.forEach((node, index) => {
      if (!newPositions.has(node.id)) {
        // Распределяем новые узлы по кругу для лучшей инициализации
        const angle = (index / nodes.length) * 2 * Math.PI;
        const radius = 300 + Math.random() * 200; // Случайный радиус от 300 до 500
        newPositions.set(node.id, { 
          x: Math.cos(angle) * radius, 
          y: Math.sin(angle) * radius 
        });
      }
      if (!newVelocities.has(node.id)) {
        newVelocities.set(node.id, { vx: 0, vy: 0 });
      }
    });

    // Удаляем отсутствующие узлы
    Array.from(newPositions.keys()).forEach(id => {
      if (!nodes.find(n => n.id === id)) {
        newPositions.delete(id);
        newVelocities.delete(id);
        pinnedRef.current.delete(id);
      }
    });

    positionsRef.current = newPositions;
    velocitiesRef.current = newVelocities;
    setPositions(newPositions);
  }, [nodes]);

  // Физическая симуляция - оптимизированная
  const simulatePhysics = useCallback((deltaTime: number) => {
    const currentPositions = positionsRef.current;
    const velocities = new Map<string, { vx: number; vy: number }>(velocitiesRef.current);

                    // Отталкивание Кулона - оптимизированное
                const maxRepulsionRadius = 1200; // Увеличенный радиус для еще больших расстояний между категориями
    
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      const posA = currentPositions.get(nodeA.id);
      if (!posA) continue;

      // Проверяем узлы для отталкивания
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeB = nodes[j];
        const posB = currentPositions.get(nodeB.id);
        if (!posB) continue;

        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;

                            // Для категорий используем больший радиус отталкивания, но с лимитом
                    const effectiveRadius = (nodeA.type === 'category' && nodeB.type === 'category')
                      ? Math.min(maxRepulsionRadius * 2.5, 2500)  // Максимум 2500px для категорий
                      : (nodeA.type === 'community' && nodeB.type === 'community')
                      ? Math.min(maxRepulsionRadius * 1.2, 1000)  // Максимум 1000px для сообществ
                      : maxRepulsionRadius;
        
        // Пропускаем узлы, которые слишком далеко
        if (distance > effectiveRadius) continue;

        // Нормализованные компоненты
        const nx = dx / distance;
        const ny = dy / distance;

        // Минимальное расстояние между узлами
        const minDistance = Math.max(50, (nodeA.size + nodeB.size) / 2);
        
        // Кулоновская сила отталкивания
        let force = physicsConfig.repulsion / (distance * distance);
        
                            // Динамическое отталкивание для категорий - чем ближе, тем сильнее отталкивание
                    if (nodeA.type === 'category' && nodeB.type === 'category') {
                      // Базовое отталкивание
                      const baseForce = 15;
                      // Дополнительное отталкивание обратно пропорционально расстоянию
                      const distanceFactor = Math.max(0.1, 1 - (distance / 1500)); // 1500px - увеличенное расстояние влияния
                      const dynamicForce = baseForce + (distanceFactor * 35); // Максимум 50x отталкивание
                      force *= dynamicForce;
                    }
                    
                    // Отталкивание между сообществами - половина силы от категорий
                    if (nodeA.type === 'community' && nodeB.type === 'community') {
                      // Базовое отталкивание (половина от категорий)
                      const baseForce = 7.5;
                      // Дополнительное отталкивание обратно пропорционально расстоянию
                      const distanceFactor = Math.max(0.1, 1 - (distance / 800)); // 800px - меньшее расстояние влияния
                      const dynamicForce = baseForce + (distanceFactor * 17.5); // Максимум 25x отталкивание (половина от категорий)
                      force *= dynamicForce;
                    }
        
        // Усиливаем силу, если узлы слишком близко
        const nodeMinDistance = Math.max(50, (nodeA.size + nodeB.size) / 2);
        if (distance < nodeMinDistance) {
          force *= 3;
        }

        // Ограничиваем максимальную силу отталкивания для стабильности
        const maxForce = physicsConfig.repulsion * 0.1; // Максимум 10% от базовой силы отталкивания
        force = Math.min(force, maxForce);

        const fx = nx * force;
        const fy = ny * force;

        const velA = velocities.get(nodeA.id)!;
        const velB = velocities.get(nodeB.id)!;

        if (!pinnedRef.current.has(nodeA.id)) {
          velA.vx -= fx * deltaTime;
          velA.vy -= fy * deltaTime;
        }
        if (!pinnedRef.current.has(nodeB.id)) {
          velB.vx += fx * deltaTime;
          velB.vy += fy * deltaTime;
        }
      }
    }

    // Притяжение Гука по рёбрам
    edges.forEach(edge => {
      const posA = currentPositions.get(edge.source);
      const posB = currentPositions.get(edge.target);
      if (!posA || !posB) return;

      const dx = posB.x - posA.x;
      const dy = posB.y - posA.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 0.0001;

      const displacement = distance - physicsConfig.springLength;
      let k = physicsConfig.attraction;
      
      // Умеренное притяжение сообществ к категориям
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (sourceNode && targetNode) {
        if ((sourceNode.type === 'community' && targetNode.type === 'category') ||
            (sourceNode.type === 'category' && targetNode.type === 'community')) {
          k *= 1.2; // Умеренное притяжение сообществ к категориям
        }
      }
      
      // Усиливаем пружину, если один из концов — закреплённый (перетаскиваемый) узел
      if (pinnedRef.current.has(edge.source) || pinnedRef.current.has(edge.target)) {
        k *= physicsConfig.dragSpringBoost ?? 1;
      }
      const force = k * displacement;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      const velA = velocities.get(edge.source)!;
      const velB = velocities.get(edge.target)!;

      if (!pinnedRef.current.has(edge.source)) {
        velA.vx += fx * deltaTime;
        velA.vy += fy * deltaTime;
      }
      if (!pinnedRef.current.has(edge.target)) {
        velB.vx -= fx * deltaTime;
        velB.vy -= fy * deltaTime;
      }
    });

    // Тяга к центру - только для сообществ, категории остаются на своих местах
    const centerX = 0;
    const centerY = 0;
    nodes.forEach(node => {
      const pos = currentPositions.get(node.id);
      if (!pos) return;
      const vel = velocities.get(node.id)!;
      if (pinnedRef.current.has(node.id)) return;

      // Категории НЕ тянутся к центру - они остаются как острова
      if (node.type === 'category') {
        return;
      }

      const dx = centerX - pos.x;
      const dy = centerY - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Гравитация только для сообществ и только если узел слишком далеко от центра
      if (distance > 600) {
        const gravityForce = physicsConfig.gravity * (distance - 600) / distance;
        vel.vx += dx * gravityForce * deltaTime;
        vel.vy += dy * gravityForce * deltaTime;
      }
    });

    // Обновление позиций с затуханием и ограничением скорости
    const newPositions = new Map(currentPositions);
    nodes.forEach(node => {
      const pos = newPositions.get(node.id);
      const vel = velocities.get(node.id)!;
      if (!pos) return;

      // Затухание
      vel.vx *= physicsConfig.damping;
      vel.vy *= physicsConfig.damping;

      // Ограничение скорости (для стабильности)
      const maxV = physicsConfig.maxVelocity ?? Infinity;
      const speed = Math.hypot(vel.vx, vel.vy);
      if (speed > maxV) {
        const scale = maxV / speed;
        vel.vx *= scale;
        vel.vy *= scale;
      }

      if (!pinnedRef.current.has(node.id)) {
        pos.x += vel.vx * deltaTime;
        pos.y += vel.vy * deltaTime;
      }
    });

    positionsRef.current = newPositions;
    velocitiesRef.current = velocities;
  }, [nodes, edges, physicsConfig]);

  // Анимационный цикл - оптимизированный
  const animate = useCallback((currentTime: number) => {
    if (lastTimeRef.current === 0) lastTimeRef.current = currentTime;
    const deltaTimeMs = Math.min(currentTime - lastTimeRef.current, 32); // кап по dt
    
                    // Ограничиваем FPS для производительности
                const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;
    
    if (deltaTimeMs >= frameInterval) {
      lastTimeRef.current = currentTime;
      const deltaTime = deltaTimeMs / 1000;

      simulatePhysics(deltaTime);
      // Пушим только когда есть визуальные изменения
      setPositions(new Map(positionsRef.current));
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [simulatePhysics]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animate]);

  // Фиксация узла (под drag)
  const pinNode = useCallback((nodeId: string) => {
    pinnedRef.current.add(nodeId);
  }, []);

  const unpinNode = useCallback((nodeId: string) => {
    pinnedRef.current.delete(nodeId);
  }, []);

  // Принудительное перемещение узла (при drag)
  const setNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    const newPositions = new Map(positionsRef.current);
    newPositions.set(nodeId, { x, y });
    positionsRef.current = newPositions;
    // Обнулим скорость, чтобы узел не "выстреливал" после отпускания
    const newVel = new Map(velocitiesRef.current);
    newVel.set(nodeId, { vx: 0, vy: 0 });
    velocitiesRef.current = newVel;
    setPositions(new Map(newPositions));
  }, []);

  const getNodePosition = useCallback((nodeId: string) => {
    return positionsRef.current.get(nodeId) || { x: 0, y: 0 };
  }, []);

  return {
    positions,
    setNodePosition,
    getNodePosition,
    pinNode,
    unpinNode,
    physicsConfig
  };
}