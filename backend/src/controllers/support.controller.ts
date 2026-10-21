import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import pool from '../config/database';
import logger from '../utils/logger';

/**
 * Create support request
 */
export const createSupportRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { type, subject, subject_ar, description, description_ar, target_entity_type, target_entity_id } = req.body;

    const result = await pool.query(
      `INSERT INTO support_requests (
        participant_id, type, state, subject, subject_ar, description, description_ar,
        target_entity_type, target_entity_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [req.user.userId, type, 'submitted', subject, subject_ar, description, description_ar, target_entity_type, target_entity_id]
    );

    logger.info('Support request created', { requestId: result.rows[0].id, userId: req.user.userId });

    res.status(201).json({
      success: true,
      data: { supportRequest: result.rows[0] },
    });
  } catch (error: any) {
    logger.error('Create support request failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_FAILED', message: 'Failed to create support request' },
    });
  }
};

/**
 * Get all support requests (staff only)
 */
export const getAllSupportRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { type, state, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM support_requests WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (type) {
      query += ` AND type = $${paramCount}`;
      values.push(type);
      paramCount++;
    }

    if (state) {
      query += ` AND state = $${paramCount}`;
      values.push(state);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: { requests: result.rows },
    });
  } catch (error: any) {
    logger.error('Get support requests failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'GET_FAILED', message: 'Failed to get support requests' },
    });
  }
};

/**
 * Get user's support requests
 */
export const getMySupportRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const result = await pool.query(
      'SELECT * FROM support_requests WHERE participant_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );

    res.json({
      success: true,
      data: { requests: result.rows },
    });
  } catch (error: any) {
    logger.error('Get my support requests failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'GET_FAILED', message: 'Failed to get support requests' },
    });
  }
};

/**
 * Update support request
 */
export const updateSupportRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { id } = req.params;
    const { state } = req.body;

    const result = await pool.query(
      `UPDATE support_requests 
       SET state = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [state, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Support request not found' },
      });
    }

    logger.info('Support request updated', { requestId: id, newState: state });

    res.json({
      success: true,
      data: { request: result.rows[0] },
    });
  } catch (error: any) {
    logger.error('Update support request failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_FAILED', message: 'Failed to update support request' },
    });
  }
};

/**
 * Add response to support request
 */
export const addResponseToSupportRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { id } = req.params;
    const { message, message_ar } = req.body;

    // For now, we'll just update the request with a note
    // In production, you'd have a separate responses table
    const result = await pool.query(
      `UPDATE support_requests 
       SET description = description || E'\\n\\nStaff Response: ' || $1,
           description_ar = description_ar || E'\\n\\nرد الموظف: ' || $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [message, message_ar, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Support request not found' },
      });
    }

    logger.info('Response added to support request', { requestId: id });

    res.status(201).json({
      success: true,
      data: { request: result.rows[0] },
    });
  } catch (error: any) {
    logger.error('Add response failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: { code: 'ADD_FAILED', message: 'Failed to add response' },
    });
  }
};
