import express from 'express';
import { 
  getAllCommunities,
  getCommunityById,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  getAdminStats,
  getAllCategories,
  getCommunityRelationships,
  searchCommunities,
  updateCommunityCategories
} from '../controllers/CommunityController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Поиск сообществ (должен быть первым)
router.get('/search', searchCommunities);

// Получить все категории (должен быть перед /:id)
router.get('/categories/all', getAllCategories);

// Получить связи между сообществами (должен быть перед /:id)
router.get('/relationships/all', getCommunityRelationships);

// Получить все сообщества
router.get('/', getAllCommunities);

// Получить сообщество по ID (должен быть последним)
router.get('/:id', getCommunityById);

// Обновить категории сообщества (основная и дополнительные)
router.put('/:id/categories', updateCommunityCategories);

// CRUD для админки (требуют авторизации)
router.post('/', authenticateToken, createCommunity);
router.put('/:id', authenticateToken, updateCommunity);
router.delete('/:id', authenticateToken, deleteCommunity);

// Получение статистики для админ панели (требует авторизации)
router.get('/admin/stats', authenticateToken, getAdminStats);

export default router; 