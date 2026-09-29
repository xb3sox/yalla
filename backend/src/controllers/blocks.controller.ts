import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import pool from '../config/database';
import logger from '../utils/logger';

/**
 * Block a user
 */
export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { blocked_user_id, reason, reason_ar } = req.body;

    // Check if already blocked
    const existing = await pool.query(
      'SELECT * FROM blocks WHERE blocker_id = $1 AND blocked_entity_id = $2',
      [req.user.userId, blocked_user_id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_BLOCKED', message: 'User already blocked' },
      });
    }

    const result = await pool.query(
      `INSERT INTO blocks (blocker_id, blocked_entity_id, blocked_entity_type, reason, reason_ar)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.userId, blocked_user_id, 'participant', reason, reason_ar]
    );

    logger.info('User blocked', { blockerId: req.user.userId, blockedId: blocked_user_id });

    res.status(201).json({
      success: true,
      data: { block: result.rows[0] },
    });
  } catch (error: any) {
    logger.error('Block user failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'BLOCK_FAILED', message: 'Failed to block user' },
    });
  }
};

/**
 * Get blocked users
 */
export const getBlockedUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const result = await pool.query(
      `SELECT b.*, u.display_name, u.phone
       FROM blocks b
       LEFT JOIN users u ON b.blocked_entity_id = u.id
       WHERE b.blocker_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.userId]
    );

    res.json({
      success: true,
      data: { blocks: result.rows },
    });
  } catch (error: any) {
    logger.error('Get blocked users failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'GET_FAILED', message: 'Failed to get blocked users' },
    });
  }
};

/**
 * Unblock user
 */
export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM blocks WHERE id = $1 AND blocker_id = $2 RETURNING *',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Block not found' },
      });
    }

    logger.info('User unblocked', { blockerId: req.user.userId, blockId: id });

    res.json({
      success: true,
      message: 'User unblocked successfully',
    });
  } catch (error: any) {
    logger.error('Unblock user failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'UNBLOCK_FAILED', message: 'Failed to unblock user' },
    });
  }
};
