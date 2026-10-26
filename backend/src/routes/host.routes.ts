import { Router } from 'express';
import { getExperiences, getExperienceRoster, verifyPin } from '../controllers/host.controller';
import { authenticate } from '../middleware/auth.middleware';
import { rateLimitPin } from '../middleware/rateLimiter.middleware';

const router = Router();

// Apply authentication middleware to all host routes
router.use(authenticate);

// GET /api/v1/host/experiences
router.get('/experiences', getExperiences);

// GET /api/v1/host/experiences/:id/roster
router.get('/experiences/:id/roster', getExperienceRoster);

// POST /api/v1/host/experiences/:id/verify-pin
router.post('/experiences/:id/verify-pin', rateLimitPin, verifyPin);

export default router;
