import { Router } from 'express';
import { ReviewController } from '../controllers/ReviewController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Публичные маршруты
router.get('/community/:communityId', ReviewController.getCommunityReviews);
router.get('/community/:communityId/stats', ReviewController.getReviewStats);

// Публичные маршруты (без авторизации для демо)
router.post('/community/:communityId', ReviewController.createReview);

// Админские маршруты (требуют авторизации)
router.get('/moderation', authenticateToken, ReviewController.getReviewsForModeration);
router.put('/:reviewId/moderate', authenticateToken, ReviewController.moderateReview);
router.delete('/:reviewId', authenticateToken, ReviewController.deleteReview);

export default router; 