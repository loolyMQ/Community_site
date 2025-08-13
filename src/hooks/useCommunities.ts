import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { Community, Category } from '../types';

interface UseCommunitiesReturn {
  communities: Community[];
  categories: Category[];
  relationships: any[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// Кэш для данных
let dataCache: {
  communities: Community[];
  categories: Category[];
  relationships: any[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 600000; // 10 минут для лучшей производительности

export const useCommunities = (): UseCommunitiesReturn => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);

  const loadData = useCallback(async () => {
    try {
      // Проверяем кэш
      const now = Date.now();
      if (dataCache && (now - dataCache.timestamp) < CACHE_DURATION) {
        setCommunities(dataCache.communities);
        setCategories(dataCache.categories);
        setRelationships(dataCache.relationships);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Загружаем данные параллельно
      const [communitiesData, categoriesData, relationshipsData] = await Promise.all([
        apiService.getCommunities(),
        apiService.getCategories(),
        apiService.getCommunityRelationships()
      ]);

      // Преобразуем данные в нужный формат (убираем console.log для производительности)
      const transformedCommunities: Community[] = communitiesData.map((community: any) => {
        
        const transformed = {
        id: community.id,
        name: community.name,
        description: community.description,
        shortDescription: community.shortDescription || community.description?.substring(0, 100) + '...',
        categoryIds: community.categories?.map((cat: any) => cat.category?.id).filter(Boolean) || [],
        mainCategoryId: community.mainCategoryId || undefined,
                    leader: {
              name: community.leader?.name || 'Не указан',
              email: community.leader?.email || [],
              phone: community.leader?.phone || [],
              social: (() => {
                const links = [];
                
                // Добавляем telegram
                if (community.leader?.telegram) {
                  const telegramLinks = Array.isArray(community.leader.telegram) ? community.leader.telegram : [community.leader.telegram];
                  links.push(...telegramLinks.filter(Boolean));
                }
                
                // Добавляем vk
                if (community.leader?.vk) {
                  const vkLinks = Array.isArray(community.leader.vk) ? community.leader.vk : [community.leader.vk];
                  links.push(...vkLinks.filter(Boolean));
                }
                
                // Добавляем phone
                if (community.leader?.phone) {
                  const phoneLinks = Array.isArray(community.leader.phone) ? community.leader.phone : [community.leader.phone];
                  links.push(...phoneLinks.filter(Boolean));
                }
                
                // Добавляем email (в User модели это строка, не массив)
                if (community.leader?.email) {
                  links.push(community.leader.email);
                }
                
                // Добавляем website только если он не совпадает с vk
                if (community.leader?.website) {
                  const websiteLinks = Array.isArray(community.leader.website) ? community.leader.website : [community.leader.website];
                  const filteredWebsiteLinks = websiteLinks.filter((link: string) => {
                    if (!link) return false;
                    // Проверяем, не совпадает ли website с vk
                    if (community.leader?.vk) {
                      const vkLinks = Array.isArray(community.leader.vk) ? community.leader.vk : [community.leader.vk];
                      return !vkLinks.includes(link);
                    }
                    return true;
                  });
                  links.push(...filteredWebsiteLinks);
                }
                
                // Добавляем другие контакты
                if (community.leader?.other && Array.isArray(community.leader.other)) {
                  links.push(...community.leader.other.filter(Boolean));
                }
                
                // Убираем дубликаты и пустые значения
                const filteredLinks = links.filter(link => link && link.trim());
                const uniqueLinks = filteredLinks.filter((link, index) => filteredLinks.indexOf(link) === index);
                return uniqueLinks.join(', ');
              })()
            },
        contacts: {
          email: community.email || '',
          phone: community.phone || '',
          social: (() => {
            const links = [];
            
            // Добавляем telegram
            if (community.telegram) {
              const telegramLinks = Array.isArray(community.telegram) ? community.telegram : [community.telegram];
              links.push(...telegramLinks.filter(Boolean));
            }
            
            // Добавляем vk
            if (community.vk) {
              const vkLinks = Array.isArray(community.vk) ? community.vk : [community.vk];
              links.push(...vkLinks.filter(Boolean));
            }
            
            // Добавляем phone
            if (community.phone) {
              const phoneLinks = Array.isArray(community.phone) ? community.phone : [community.phone];
              links.push(...phoneLinks.filter(Boolean));
            }
            
            // Добавляем email
            if (community.email) {
              const emailLinks = Array.isArray(community.email) ? community.email : [community.email];
              links.push(...emailLinks.filter(Boolean));
            }
            
            // Добавляем website только если он не совпадает с vk
            if (community.website) {
              const websiteLinks = Array.isArray(community.website) ? community.website : [community.website];
              const filteredWebsiteLinks = websiteLinks.filter((link: string) => {
                if (!link) return false;
                // Проверяем, не совпадает ли website с vk
                if (community.vk) {
                  const vkLinks = Array.isArray(community.vk) ? community.vk : [community.vk];
                  return !vkLinks.includes(link);
                }
                return true;
              });
              links.push(...filteredWebsiteLinks);
            }
            
            // Убираем дубликаты и пустые значения - оптимизированно
            const filteredLinks = links.filter(link => link && link.trim());
            const uniqueLinks = [...new Set(filteredLinks)]; // O(n) вместо O(n²)
            return uniqueLinks.join(', ');
          })()
        },
        news: [], // Пока пустой массив, можно добавить позже
        events: [], // Пока пустой массив, можно добавить позже
        achievements: community.achievements || '',
        requirements: community.requirements || '',
        meetingSchedule: community.meetingSchedule || '',
        location: community.location || '',
        website: community.website || '',
        isOfficial: community.isOfficial || false,
        isVerified: community.isVerified || false,
        isActive: community.isActive || true,
        maxMembers: community.maxMembers,
        currentMembers: community.currentMembers || 0,
        averageRating: community.averageRating || 0,
        reviewCount: community.reviewCount || 0,
        memberCount: community.memberCount || 0,
        createdAt: community.createdAt,
        updatedAt: community.updatedAt
      };
        
        return transformed;
      });

      const transformedCategories: Category[] = categoriesData.map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color || '#3B82F6',
        icon: category.icon || '🏷️'
      }));

      // Обновляем кэш
      dataCache = {
        communities: transformedCommunities,
        categories: transformedCategories,
        relationships: relationshipsData,
        timestamp: now
      };

      setCommunities(transformedCommunities);
      setCategories(transformedCategories);
      setRelationships(relationshipsData);
    } catch (err) {
      console.error('Error loading communities data:', err);
      setError('Ошибка загрузки данных сообществ');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const refresh = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    
    // Ограничиваем частоту запросов - минимум 1000 миллисекунд между запросами
    if (timeSinceLastRefresh < 1000) {
      return;
    }
    
    // Очищаем кэш при принудительном обновлении
    dataCache = null;
    setLastRefreshTime(now);
    loadData();
  }, [lastRefreshTime, loadData]);

  return {
    communities,
    categories,
    relationships,
    loading,
    error,
    refresh
  };
}; 