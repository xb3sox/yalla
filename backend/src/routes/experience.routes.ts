import { Router } from 'express';
import {
  getExperiences,
  getExperienceById,
  searchExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
} from '../controllers/experience.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/experiences
 * @desc    Get all published experiences
 * @access  Public
 */
router.get('/', getExperiences);

/**
 * @route   GET /api/v1/experiences/search
 * @desc    Search experiences
 * @access  Public
 */
router.get('/search', searchExperiences);

/**
 * @route   GET /api/v1/experiences/:id
 * @desc    Get experience by ID
 * @access  Public
 */
router.get('/:id', getExperienceById);

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
