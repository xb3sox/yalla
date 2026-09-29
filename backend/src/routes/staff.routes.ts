import { Router } from 'express';
import {
  updateExperienceState,
  assignHost,
  updateReservationState,
  getAllReservations,
  getDashboardStatistics,
  getAllUsers,
  updateUserRole,
} from '../controllers/staff.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All staff routes require authentication and staff role
router.use(authenticate);
router.use(authorize('operations', 'support', 'trust_safety', 'admin'));

/**
 * @route   GET /api/v1/staff/dashboard
 * @desc    Get dashboard statistics
 * @access  Private (Staff)
 */
router.get('/dashboard', getDashboardStatistics);

/**
 * @route   GET /api/v1/staff/users
 * @desc    Get all users
 * @access  Private (Staff)
 */
router.get('/users', getAllUsers);

/**
 * @route   PUT /api/v1/staff/users/:id/role
 * @desc    Update user role (admin only)
 * @access  Private (Admin)
 */
router.put('/users/:id/role', authorize('admin'), updateUserRole);

/**
 * @route   GET /api/v1/staff/reservations
 * @desc    Get all reservations
 * @access  Private (Staff)
 */
router.get('/reservations', getAllReservations);

/**
 * @route   PUT /api/v1/staff/reservations/:id/state
 * @desc    Update reservation state
 * @access  Private (Staff)
 */
router.put('/reservations/:id/state', updateReservationState);

/**
 * @route   PUT /api/v1/staff/experiences/:id/state
 * @desc    Update experience state
 * @access  Private (Staff)
 */
router.put('/experiences/:id/state', updateExperienceState);

/**
 * @route   POST /api/v1/staff/experiences/:id/assign-host
 * @desc    Assign host to experience
 * @access  Private (Staff)
 */
router.post('/experiences/:id/assign-host', assignHost);

export default router;
