export interface Community {
  id: string;
  name: string;
  description: string;
  categoryIds: string[];
  mainCategoryId?: string;
  additionalCategoryIds?: string[];
  leader: {
    name: string;
    email: string;
    phone?: string;
    social?: string;
  };
  contacts: {
    email: string;
    phone?: string;
    social?: string;
  };
  news: NewsItem[];

  image?: string;
  isOfficial: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

export interface GraphNode {
  id: string;
  type: 'category' | 'community';
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  data: Community | Category;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'category-community' | 'community-community';
  weight: number;
  color?: string;
  isMain?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface CommunityFormData {
  name: string;
  description: string;
  categoryIds: string[];
  leader: {
    name: string;
    email: string;
    phone?: string;
    social?: string;
  };
  contacts: {
    email: string;
    phone?: string;
    social?: string;
  };
  isOfficial: boolean;
}

export interface JoinFormData {
  id: string;
  communityId: string;
  name: string;
  contact: string; // Email, Telegram или ВК
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  adminComment?: string; // Комментарий администратора
  isArchived?: boolean; // Отправлена ли в архив
}

export interface CollaborationFormData {
  id: string;
  communityId: string;
  name: string;
  contact: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  adminComment?: string; // Комментарий администратора
  isArchived?: boolean; // Отправлена ли в архив
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  createdAt: string;
}

export interface AdminStats {
  totalCommunities: number;
  totalJoinRequests: number;
  pendingJoinRequests: number;
  totalCollaborationRequests: number;
  pendingCollaborationRequests: number;
  totalReviews: number;
  pendingReviews: number;
}

export interface Review {
  id: string;
  userId?: string;
  communityId: string;
  isAnonymous: boolean;
  rating: number;
  title?: string;
  content: string;
  isVerified: boolean;
  isPublished: boolean;
  isActive: boolean;
  adminComment?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
    faculty?: string;
    course?: string;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}

export interface ReviewsResponse {
  success: boolean;
  data: {
    reviews: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    stats: {
      averageRating: number;
      totalReviews: number;
    };
  };
} 