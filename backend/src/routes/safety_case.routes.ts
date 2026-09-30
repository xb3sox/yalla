import { Router } from 'express';
import {
  createSafetyCase,
  getSafetyCaseById,
  getAllSafetyCases,
  updateSafetyCase,
  addActionToSafetyCase,
  getSafetyCaseStatistics,
  deleteSafetyCase,
} from '../controllers/safety_case.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All safety case routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/safety-cases
 * @desc    Create a safety case
 * @access  Private (All authenticated users)
 */
router.post('/', createSafetyCase);

/**
 * @route   GET /api/v1/safety-cases
 * @desc    Get all safety cases
 * @access  Private (Trust & Safety, Admin)
 */
router.get('/', authorize('trust_safety', 'admin'), getAllSafetyCases);

/**
 * @route   GET /api/v1/safety-cases/statistics
 * @desc    Get safety case statistics
 * @access  Private (Trust & Safety, Admin)
 */
router.get('/statistics', authorize('trust_safety', 'admin'), getSafetyCaseStatistics);

/**
 * @route   GET /api/v1/safety-cases/:id
 * @desc    Get safety case by ID
 * @access  Private (Reporter, Trust & Safety, Admin)
 */
router.get('/:id', getSafetyCaseById);

/**
 * @route   PUT /api/v1/safety-cases/:id
 * @desc    Update safety case
 * @access  Private (Trust & Safety, Admin)
 */
router.put('/:id', authorize('trust_safety', 'admin'), updateSafetyCase);

/**
 * @route   POST /api/v1/safety-cases/:id/actions
 * @desc    Add action to safety case
 * @access  Private (Trust & Safety, Admin)
 */
router.post('/:id/actions', authorize('trust_safety', 'admin'), addActionToSafetyCase);

/**
 * @route   DELETE /api/v1/safety-cases/:id
 * @desc    Delete safety case
 * @access  Private (Admin only)
 */
router.delete('/:id', authorize('admin'), deleteSafetyCase);

export default router;
