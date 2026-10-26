import { Router } from 'express';
import {
  getDashboardSummary,
  getHostExperiences,
  scheduleSession,
  updateSession,
  getPayouts,
  getExperienceRoster,
  verifyPin,
} from '../controllers/host_portal.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Require authentication and role === 'host' || role === 'admin'
router.use(authenticate);
router.use(requireRole(['host', 'admin']));

// GET /api/v1/host/dashboard/summary
router.get('/dashboard/summary', getDashboardSummary);

// GET /api/v1/host/experiences
router.get('/experiences', getHostExperiences);

// POST /api/v1/host/sessions
router.post('/sessions', scheduleSession);

// PATCH /api/v1/host/sessions/:id
router.patch('/sessions/:id', updateSession);

// GET /api/v1/host/payouts
router.get('/payouts', getPayouts);

// GET /api/v1/host/experiences/:id/roster
router.get('/experiences/:id/roster', getExperienceRoster);

// POST /api/v1/host/experiences/:id/verify-pin
router.post('/experiences/:id/verify-pin', verifyPin);

export default router;
