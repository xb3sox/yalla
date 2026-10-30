import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import experienceModel, { EXPERIENCE_TRANSITIONS } from '../models/experience.model';
import reservationModel from '../models/reservation.model';
import auditModel from '../models/audit.model';
import userModel from '../models/user.model';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import logger from '../utils/logger';

/**
 * Update experience state
 */
export const updateExperienceState = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { id } = req.params;
    const { state } = req.body;

    const experience = await experienceModel.findById(id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPERIENCE_NOT_FOUND',
          message: 'Experience not found',
        },
      });
    }

    if (!EXPERIENCE_TRANSITIONS[experience.plan_state]?.includes(state)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: `Cannot transition from ${experience.plan_state} to ${state}`,
        },
      });
    }

    const updated = await experienceModel.update(id, { plan_state: state });

    // Log audit event
    await auditModel.logExperienceUpdated(
      req.user.userId,
      req.user.role,
      id,
      { field: 'plan_state', old_value: experience.plan_state, new_value: state }
    );

    logger.info('Experience state updated', {
      experienceId: id,
      oldState: experience.plan_state,
      newState: state,
      staffId: req.user.userId,
    });

    res.json({
      success: true,
      data: { experience: updated },
      message: 'Experience state updated successfully',
    });
  } catch (error: any) {
    if (error.message?.includes('Invalid state transition')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: error.message,
        },
      });
    }

    logger.error('Update experience state failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_EXPERIENCE_STATE_FAILED',
        message: 'Failed to update experience state',
      },
    });
  }
};

/**
 * Assign host to experience
 */
export const assignHost = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { id } = req.params;
    const { primary_host_id, backup_host_id } = req.body;

    const experience = await experienceModel.findById(id);

    if (!experience) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'EXPERIENCE_NOT_FOUND',
          message: 'Experience not found',
        },
      });
    }

    // Host IDs are user UUIDs (FK). Reject malformed/unknown IDs with 400
    // instead of letting Postgres throw an opaque 500.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    for (const [field, value] of [
      ['primary_host_id', primary_host_id],
      ['backup_host_id', backup_host_id],
    ] as const) {
      if (value === undefined || value === null) continue;
      const host =
        typeof value === 'string' && UUID_RE.test(value)
          ? await userModel.findById(value)
          : null;
      if (!host) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_HOST',
            message: `${field} must reference an existing user`,
          },
        });
      }
    }

    const updates: any = {};
    if (primary_host_id !== undefined) updates.primary_host_id = primary_host_id;
    if (backup_host_id !== undefined) updates.backup_host_id = backup_host_id;

    const updated = await experienceModel.update(id, updates);

    // Log audit event
    await auditModel.create({
      actor_id: req.user.userId,
      actor_role: req.user.role,
      action: 'host_assigned',
      resource_type: 'experience',
      resource_id: id,
      details: { primary_host_id, backup_host_id },
      classification: 'internal',
    });

    logger.info('Host assigned to experience', {
      experienceId: id,
      primaryHostId: primary_host_id,
      backupHostId: backup_host_id,
      staffId: req.user.userId,
    });

    res.json({
      success: true,
      data: { experience: updated },
      message: 'Host assigned successfully',
    });
  } catch (error: any) {
    logger.error('Assign host failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'ASSIGN_HOST_FAILED',
        message: 'Failed to assign host',
      },
    });
  }
};

/**
 * Update reservation state (staff)
 */
export const updateReservationState = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { id } = req.params;
    const { state } = req.body;

    const reservation = await reservationModel.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: 'Reservation not found',
        },
      });
    }

    const updated = await reservationModel.updateState(id, state);

    // Log audit event
    await auditModel.create({
      actor_id: req.user.userId,
      actor_role: req.user.role,
      action: 'reservation_state_updated',
      resource_type: 'reservation',
      resource_id: id,
      details: { old_state: reservation.state, new_state: state },
      classification: 'confidential',
    });

    logger.info('Reservation state updated by staff', {
      reservationId: id,
      oldState: reservation.state,
      newState: state,
      staffId: req.user.userId,
    });

    res.json({
      success: true,
      data: { reservation: updated },
      message: 'Reservation state updated successfully',
    });
  } catch (error: any) {
    if (error.message?.includes('Invalid state transition')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: error.message,
        },
      });
    }

    logger.error('Update reservation state failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_RESERVATION_STATE_FAILED',
        message: 'Failed to update reservation state',
      },
    });
  }
};

// Spreadsheet formula injection: a display name like "=2+5+cmd|' /C calc'!A0"
// executes when staff open an export in Excel/Sheets. Prefix such cells.
const neutralizeSpreadsheetFormulas = (rows: Record<string, any>[]) =>
  rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        typeof value === 'string' && /^[=+\-@\t\r]/.test(value) ? `'${value}` : value,
      ])
    )
  );

/**
 * Get all reservations (staff)
 */
export const exportReservations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { status, experienceId, startDate, endDate, format = 'csv' } = req.query;

    let query = `
      SELECT r.id, r.state as status, r.created_at, r.payment_state,
             u.display_name as participant_name, u.phone as participant_phone,
             e.title as experience_title
      FROM reservations r
      JOIN users u ON r.participant_id = u.id
      JOIN experiences e ON r.experience_id = e.id
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramCount = 1;

    if (status) {
      query += ` AND r.state = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (experienceId) {
      query += ` AND r.experience_id = $${paramCount}`;
      values.push(experienceId);
      paramCount++;
    }

    if (startDate) {
      query += ` AND r.created_at >= $${paramCount}`;
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND r.created_at <= $${paramCount}`;
      values.push(endDate);
      paramCount++;
    }

    query += ` ORDER BY r.created_at DESC`;

    const pool = await import('../config/database').then(m => m.default);
    const result = await pool.query(query, values);

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reservations');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 36 },
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Created At', key: 'created_at', width: 25 },
        { header: 'Payment State', key: 'payment_state', width: 20 },
        { header: 'Participant Name', key: 'participant_name', width: 30 },
        { header: 'Participant Phone', key: 'participant_phone', width: 20 },
        { header: 'Experience Title', key: 'experience_title', width: 40 },
      ];

      worksheet.addRows(neutralizeSpreadsheetFormulas(result.rows));

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=reservations.xlsx');

      await workbook.xlsx.write(res);
      return res.end();
    } else {
      const json2csvParser = new Parser();
      const csv = json2csvParser.parse(neutralizeSpreadsheetFormulas(result.rows));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=reservations.csv');
      return res.status(200).send(csv);
    }
  } catch (error: any) {
    logger.error('Export reservations failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_RESERVATIONS_FAILED',
        message: 'Failed to export reservations',
      },
    });
  }
};

/**
 * Get all reservations (staff)
 */
export const getAllReservations = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { state, experience_id, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT r.*, u.display_name, u.phone, e.title, e.title_ar
      FROM reservations r
      JOIN users u ON r.participant_id = u.id
      JOIN experiences e ON r.experience_id = e.id
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramCount = 1;

    if (state) {
      query += ` AND r.state = $${paramCount}`;
      values.push(state);
      paramCount++;
    }

    if (experience_id) {
      query += ` AND r.experience_id = $${paramCount}`;
      values.push(experience_id);
      paramCount++;
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const pool = await import('../config/database').then(m => m.default);
    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: { reservations: result.rows },
      meta: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        count: result.rows.length,
      },
    });
  } catch (error: any) {
    logger.error('Get all reservations failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_RESERVATIONS_FAILED',
        message: 'Failed to get reservations',
      },
    });
  }
};

/**
 * Get dashboard statistics
 */
export const getDashboardStatistics = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const pool = await import('../config/database').then(m => m.default);

    // Get total experiences
    const experiencesResult = await pool.query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN plan_state = 'published' THEN 1 END)::int as published,
        COUNT(CASE WHEN plan_state = 'draft' THEN 1 END)::int as draft
      FROM experiences
    `);

    // Get total reservations
    const reservationsResult = await pool.query(`
      SELECT 
        COUNT(*)::int as total,
        COUNT(CASE WHEN state = 'confirmed' THEN 1 END)::int as confirmed,
        COUNT(CASE WHEN state = 'waitlisted' THEN 1 END)::int as waitlisted,
        COUNT(CASE WHEN state = 'cancelled_by_participant' THEN 1 END)::int as cancelled
      FROM reservations
    `);

    // Get total users
    const usersResult = await pool.query(`
      SELECT COUNT(*)::int as total
      FROM users
      WHERE is_active = true
    `);

    // Get revenue (completed payments)
    const revenueResult = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total_revenue
      FROM payments
      WHERE status = 'completed'
    `);

    res.json({
      success: true,
      data: {
        experiences: experiencesResult.rows[0],
        reservations: reservationsResult.rows[0],
        users: usersResult.rows[0],
        revenue: revenueResult.rows[0],
      },
    });
  } catch (error: any) {
    logger.error('Get dashboard statistics failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_STATISTICS_FAILED',
        message: 'Failed to get dashboard statistics',
      },
    });
  }
};

/**
 * Get all users (staff)
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const { role, is_active, limit = 100, offset = 0 } = req.query;

    let query = 'SELECT id, phone, display_name, language, role, is_active, created_at FROM users WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (role) {
      query += ` AND role = $${paramCount}`;
      values.push(role);
      paramCount++;
    }

    if (is_active !== undefined) {
      query += ` AND is_active = $${paramCount}`;
      values.push(is_active === 'true');
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const pool = await import('../config/database').then(m => m.default);
    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: { users: result.rows },
      meta: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        count: result.rows.length,
      },
    });
  } catch (error: any) {
    logger.error('Get all users failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USERS_FAILED',
        message: 'Failed to get users',
      },
    });
  }
};

/**
 * Update user role (admin only)
 */
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only admins can update user roles',
        },
      });
    }

    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['participant', 'host', 'operations', 'support', 'trust_safety', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        },
      });
    }

    const pool = await import('../config/database').then(m => m.default);
    const result = await pool.query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, phone, display_name, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    // Log audit event
    await auditModel.create({
      actor_id: req.user.userId,
      actor_role: req.user.role,
      action: 'user_role_updated',
      resource_type: 'user',
      resource_id: id,
      details: { new_role: role },
      classification: 'restricted',
    });

    logger.info('User role updated', {
      userId: id,
      newRole: role,
      adminId: req.user.userId,
    });

    res.json({
      success: true,
      data: { user: result.rows[0] },
      message: 'User role updated successfully',
    });
  } catch (error: any) {
    logger.error('Update user role failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_USER_ROLE_FAILED',
        message: 'Failed to update user role',
      },
    });
  }
};
