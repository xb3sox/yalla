import { Router } from 'express';
import { addFavorite, getFavorites, removeFavorite } from '../controllers/favorites.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/favorites
 * @desc    Add experience to favorites
 * @access  Private
 */
router.post('/', authenticate, addFavorite);

/**
 * @route   GET /api/v1/favorites
 * @desc    Get user favorites
 * @access  Private
 */
router.get('/', authenticate, getFavorites);

/**
 * @route   DELETE /api/v1/favorites/:id
 * @desc    Remove favorite
 * @access  Private
 */
router.delete('/:id', authenticate, removeFavorite);

export default router;
