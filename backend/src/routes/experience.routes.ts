import { Router } from 'express';
import {
  getExperiences,
  getExperienceById,
  searchExperiences,
  staffSearchExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
} from '../controllers/experience.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getRecommendations } from '../controllers/recommendation.controller';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

/**
 * @route   GET /api/v1/experiences
 * @desc    Get all published experiences
 * @access  Public
 */
router.get('/', cacheMiddleware(300), getExperiences);

/**
 * @route   GET /api/v1/experiences/recommendations
 * @desc    Get personalized experience recommendations
 * @access  Private
 */
router.get('/recommendations', authenticate, getRecommendations);

/**
 * @route   GET /api/v1/experiences/search
 * @desc    Search experiences
 * @access  Public
 */
router.get('/search', cacheMiddleware(300), searchExperiences);

/**
 * @route   GET /api/v1/experiences/:id
 * @desc    Get experience by ID
 * @access  Public
 */
router.get('/:id', cacheMiddleware(300), getExperienceById);

/**
 * @route   GET /api/v1/experiences/staff/search
 * @desc    Staff search experiences
 * @access  Private (Staff only)
 */
router.get('/staff/search', authenticate, authorize('operations', 'admin'), staffSearchExperiences);

/**
 * @route   POST /api/v1/experiences
 * @desc    Create experience
 * @access  Private (Staff only)
 */
router.post('/', authenticate, authorize('operations', 'admin'), createExperience);

/**
 * @route   PUT /api/v1/experiences/:id
 * @desc    Update experience
 * @access  Private (Staff only)
 */
router.put('/:id', authenticate, authorize('operations', 'admin'), updateExperience);

/**
 * @route   DELETE /api/v1/experiences/:id
 * @desc    Delete experience
 * @access  Private (Staff only)
 */
router.delete('/:id', authenticate, authorize('operations', 'admin'), deleteExperience);

export default router;
