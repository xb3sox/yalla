import { Router } from 'express';
import rewardController from '../controllers/reward.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all reward routes
router.use(authenticate);

// Get user rewards balance and transaction history
router.get('/', rewardController.getRewards);

// Redeem points
router.post('/redeem', rewardController.redeemRewards);

export default router;
