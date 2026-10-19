import { Router } from 'express';
import { createFeedback, getExperienceFeedbacks } from '../controllers/feedback.controller';
import { authenticate } from '../middleware/auth.middleware';
import { apiLimiter } from '../middleware/security.middleware';

const router = Router();

// Apply rate limiting to all feedback routes
router.use(apiLimiter);

/**
 * @route   POST /api/v1/feedbacks
 * @desc    Submit feedback for an experience (via a reservation)
 * @access  Private (Authenticated users only)
 */
router.post('/', authenticate, createFeedback);

/**
 * @route   GET /api/v1/feedbacks/experience/:experienceId
 * @desc    Get all feedbacks for a specific experience
 * @access  Public (or could be private depending on requirements)
 */
router.get('/experience/:experienceId', getExperienceFeedbacks);

export default router;
