import { Router } from 'express';
import {
  createSupportRequest,
  getAllSupportRequests,
  getMySupportRequests,
  updateSupportRequest,
  addResponseToSupportRequest,
} from '../controllers/support.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/support-requests
 * @desc    Create support request
 * @access  Private
 */
router.post('/', authenticate, createSupportRequest);

/**
 * @route   GET /api/v1/support-requests
 * @desc    Get all support requests (staff only)
 * @access  Private (Staff)
 */
router.get('/', authenticate, authorize('support', 'admin'), getAllSupportRequests);

/**
 * @route   GET /api/v1/support-requests/my-requests
 * @desc    Get user's support requests
 * @access  Private
 */
router.get('/my-requests', authenticate, getMySupportRequests);

/**
 * @route   PUT /api/v1/support-requests/:id
 * @desc    Update support request
 * @access  Private (Staff)
 */
router.put('/:id', authenticate, authorize('support', 'admin'), updateSupportRequest);

/**
 * @route   POST /api/v1/support-requests/:id/responses
 * @desc    Add response to support request
 * @access  Private (Staff)
 */
router.post('/:id/responses', authenticate, authorize('support', 'admin'), addResponseToSupportRequest);

export default router;
