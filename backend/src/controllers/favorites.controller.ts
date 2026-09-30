import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import pool from '../config/database';
import logger from '../utils/logger';

/**
 * Add experience to favorites
 */
export const addFavorite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { experience_id } = req.body;

    // Check if already favorited
    const existing = await pool.query(
      'SELECT * FROM favorites WHERE user_id = $1 AND experience_id = $2',
      [req.user.userId, experience_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_FAVORITED', message: 'Experience already in favorites' },
      });
    }

    const result = await pool.query(
      'INSERT INTO favorites (user_id, experience_id) VALUES ($1, $2) RETURNING *',
      [req.user.userId, experience_id]
    );

    logger.info('Favorite added', { userId: req.user.userId, experienceId: experience_id });

    res.status(201).json({
      success: true,
      data: { favorite: result.rows[0] },
    });
  } catch (error: any) {
    logger.error('Add favorite failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'ADD_FAILED', message: 'Failed to add favorite' },
    });
  }
};

/**
 * Get user favorites
 */
export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const result = await pool.query(
      `SELECT f.*, e.title, e.title_ar, e.price, e.area, e.area_ar
       FROM favorites f
       JOIN experiences e ON f.experience_id = e.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.userId]
    );

    res.json({
      success: true,
      data: { favorites: result.rows },
    });
  } catch (error: any) {
    logger.error('Get favorites failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'GET_FAILED', message: 'Failed to get favorites' },
    });
  }
};

/**
 * Remove favorite
 */
export const removeFavorite = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM favorites WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Favorite not found' },
      });
    }

    logger.info('Favorite removed', { userId: req.user.userId, favoriteId: id });

    res.json({
      success: true,
      message: 'Favorite removed successfully',
    });
  } catch (error: any) {
    logger.error('Remove favorite failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'REMOVE_FAILED', message: 'Failed to remove favorite' },
    });
  }
};
