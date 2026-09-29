import { Router } from 'express';
import { blockUser, getBlockedUsers, unblockUser } from '../controllers/blocks.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/blocks
 * @desc    Block a user
 * @access  Private
 */
router.post('/', authenticate, blockUser);

/**
 * @route   GET /api/v1/blocks
 * @desc    Get blocked users
 * @access  Private
 */
router.get('/', authenticate, getBlockedUsers);

/**
 * @route   DELETE /api/v1/blocks/:id
 * @desc    Unblock user
 * @access  Private
 */
router.delete('/:id', authenticate, unblockUser);

export default router;
