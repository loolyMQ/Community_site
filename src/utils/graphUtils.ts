import { GraphData, GraphNode, GraphEdge, Category, Community } from '../types';

export function generateGraphData(
  communitiesData: Community[] = [],
  categoriesData: Category[] = [],
  relationshipsData: any[] = []
): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Добавляем категории как узлы
  categoriesData.forEach((category, index) => {
    nodes.push({
      id: category.id,
      type: 'category',
      label: category.name,
      x: Math.cos((index * 2 * Math.PI) / categoriesData.length) * 300,
      y: Math.sin((index * 2 * Math.PI) / categoriesData.length) * 300,
      size: 20,
      color: category.color,
      data: category
    });
  });

  // Добавляем сообщества как узлы
  communitiesData.forEach((community, _index) => {
    // Вычисляем позицию сообщества между его категориями
    const categoryNodes = community.categoryIds.map(id => 
      nodes.find(node => node.id === id)
    ).filter(Boolean) as GraphNode[];

    let x = 0, y = 0;
    if (categoryNodes.length > 0) {
      x = categoryNodes.reduce((sum, node) => sum + node.x, 0) / categoryNodes.length;
      y = categoryNodes.reduce((sum, node) => sum + node.y, 0) / categoryNodes.length;
      
      // Добавляем небольшое случайное смещение
      x += (Math.random() - 0.5) * 100;
      y += (Math.random() - 0.5) * 100;
    } else {
      // Если нет категорий, размещаем случайно
      x = (Math.random() - 0.5) * 400;
      y = (Math.random() - 0.5) * 400;
    }

    const size = 12; // Фиксированный размер для сообществ

    nodes.push({
      id: community.id,
      type: 'community',
      label: community.name,
      x,
      y,
      size,
      color: '#666666',
      data: community
    });

    // Создаем связи между сообществом и его категориями
    const mainCategoryId = community.mainCategoryId || community.categoryIds[0];
    community.categoryIds.forEach(categoryId => {
      const category = categoriesData.find(c => c.id === categoryId);
      const isMain = categoryId === mainCategoryId;
      edges.push({
        id: `${community.id}-${categoryId}`,
        source: community.id,
        target: categoryId,
        type: 'category-community',
        weight: isMain ? 2 : 1,
        color: category?.color,
        isMain
      });
    });
  });

  return { nodes, edges };
}

export function calculateNodeSize(node: GraphNode): number {
  if (node.type === 'category') {
    return 20;
  }
  
  return 12; // Фиксированный размер для сообществ
}

export function getNodeColor(node: GraphNode, isHighlighted: boolean = false): string {
  if (node.type === 'category') {
    const category = node.data as Category;
    return isHighlighted ? category.color : category.color + '80';
  }
  
  return isHighlighted ? '#333333' : '#666666';
}

export function getConnectedNodes(nodeId: string, edges: GraphEdge[]): string[] {
  const connected: string[] = [];
  
  edges.forEach(edge => {
    if (edge.source === nodeId) {
      connected.push(edge.target);
    } else if (edge.target === nodeId) {
      connected.push(edge.source);
    }
  });
  
  return connected;
}

export function filterGraphByCategory(
  graphData: GraphData, 
  categoryId: string | null
): GraphData {
  if (!categoryId) {
    return graphData;
  }

  const connectedCommunityIds = new Set<string>();
  
  // Находим все сообщества, связанные с выбранной категорией
  graphData.edges.forEach(edge => {
    if (edge.source === categoryId || edge.target === categoryId) {
      const communityId = edge.source === categoryId ? edge.target : edge.source;
      if (graphData.nodes.find(node => node.id === communityId)?.type === 'community') {
        connectedCommunityIds.add(communityId);
      }
    }
  });

  // Фильтруем узлы
  const filteredNodes = graphData.nodes.filter(node => 
    node.id === categoryId || connectedCommunityIds.has(node.id)
  );

  // Фильтруем ребра
  const filteredEdges = graphData.edges.filter(edge => 
    filteredNodes.some(node => node.id === edge.source) &&
    filteredNodes.some(node => node.id === edge.target)
  );

  return {
    nodes: filteredNodes,
    edges: filteredEdges
  };
}

export function addCommunityToGraph(
  graphData: GraphData,
  community: Community
): GraphData {
  const newNodes = [...graphData.nodes];
  const newEdges = [...graphData.edges];

  // Добавляем новый узел сообщества
  const newNode: GraphNode = {
    id: community.id,
    type: 'community',
    label: community.name,
    x: (Math.random() - 0.5) * 400,
    y: (Math.random() - 0.5) * 400,
    size: 12, // Фиксированный размер для сообществ
    color: '#666666',
    data: community
  };

  newNodes.push(newNode);

  // Добавляем связи с категориями
  community.categoryIds.forEach(categoryId => {
    newEdges.push({
      id: `${community.id}-${categoryId}`,
      source: community.id,
      target: categoryId,
      type: 'category-community',
      weight: 1
    });
  });

  return {
    nodes: newNodes,
    edges: newEdges
  };
} 