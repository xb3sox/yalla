import { Router } from 'express';
import {
  getAuditEvents,
  getAuditEventsByResource,
  getAuditEventsByActor,
  getAuditStatistics,
  createAuditEvent,
} from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/audit
 * @desc    Get audit events with filters
 * @access  Private (Staff only)
 */
router.get(
  '/',
  authenticate,
  authorize('operations', 'support', 'trust_safety', 'admin'),
  getAuditEvents
);

/**
 * @route   GET /api/v1/audit/statistics
 * @desc    Get audit statistics
 * @access  Private (Staff only)
 */
router.get(
  '/statistics',
  authenticate,
  authorize('operations', 'admin'),
  getAuditStatistics
);

/**
 * @route   GET /api/v1/audit/resource/:resourceType/:resourceId
 * @desc    Get audit events for a specific resource
 * @access  Private (Staff only)
 */
router.get(
  '/resource/:resourceType/:resourceId',
  authenticate,
  authorize('operations', 'support', 'trust_safety', 'admin'),
  getAuditEventsByResource
);

/**
 * @route   GET /api/v1/audit/actor/:actorId
 * @desc    Get audit events for a specific actor
 * @access  Private (Staff only)
 */
router.get(
  '/actor/:actorId',
  authenticate,
  authorize('operations', 'support', 'trust_safety', 'admin'),
  getAuditEventsByActor
);

/**
 * @route   POST /api/v1/audit
 * @desc    Create audit event (internal use)
 * @access  Private (Staff only)
 */
router.post(
  '/',
  authenticate,
  authorize('operations', 'support', 'trust_safety', 'admin'),
  createAuditEvent
);

export default router;
