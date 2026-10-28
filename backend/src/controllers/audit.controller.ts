import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import auditModel from '../models/audit.model';
import logger from '../utils/logger';
import { parsePagination } from '../utils/pagination';

/**
 * Get audit events with filters
 */
export const getAuditEvents = async (req: AuthRequest, res: Response) => {
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

    const {
      actor_id,
      action,
      resource_type,
      resource_id,
      classification,
      start_date,
      end_date,
      limit = 100,
      offset = 0,
    } = req.query;

    const filters = {
      actor_id: actor_id as string,
      action: action as string,
      resource_type: resource_type as string,
      resource_id: resource_id as string,
      classification: classification as string,
      start_date: start_date ? new Date(start_date as string) : undefined,
      end_date: end_date ? new Date(end_date as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const events = await auditModel.findAll(filters);

    res.json({
      success: true,
      data: { events },
      meta: {
        limit: filters.limit,
        offset: filters.offset,
        count: events.length,
      },
    });
  } catch (error: any) {
    logger.error('Get audit events failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_AUDIT_EVENTS_FAILED',
        message: 'Failed to get audit events',
      },
    });
  }
};

/**
 * Get audit events for a specific resource
 */
export const getAuditEventsByResource = async (req: AuthRequest, res: Response) => {
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

    const { resourceType, resourceId } = req.params;
    const events = await auditModel.findByResource(resourceType, resourceId);

    res.json({
      success: true,
      data: { events },
    });
  } catch (error: any) {
    logger.error('Get audit events by resource failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_AUDIT_EVENTS_FAILED',
        message: 'Failed to get audit events',
      },
    });
  }
};

/**
 * Get audit events for a specific actor
 */
export const getAuditEventsByActor = async (req: AuthRequest, res: Response) => {
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

    const { actorId } = req.params;
    const { limit } = parsePagination(req.query, { defaultLimit: 100, maxLimit: 200 });

    const events = await auditModel.findByActor(actorId, limit);

    res.json({
      success: true,
      data: { events },
    });
  } catch (error: any) {
    logger.error('Get audit events by actor failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_AUDIT_EVENTS_FAILED',
        message: 'Failed to get audit events',
      },
    });
  }
};

/**
 * Get audit statistics
 */
export const getAuditStatistics = async (req: AuthRequest, res: Response) => {
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

    const { start_date, end_date } = req.query;

    const statistics = await auditModel.getStatistics(
      start_date ? new Date(start_date as string) : undefined,
      end_date ? new Date(end_date as string) : undefined
    );

    res.json({
      success: true,
      data: { statistics },
    });
  } catch (error: any) {
    logger.error('Get audit statistics failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_AUDIT_STATISTICS_FAILED',
        message: 'Failed to get audit statistics',
      },
    });
  }
};

/**
 * Create audit event (internal use)
 */
export const createAuditEvent = async (req: AuthRequest, res: Response) => {
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

    const { action, resource_type, resource_id, details, classification } = req.body;

    const event = await auditModel.create({
      actor_id: req.user.userId,
      actor_role: req.user.role,
      action,
      resource_type,
      resource_id,
      details,
      classification,
    });

    res.status(201).json({
      success: true,
      data: { event },
      message: 'Audit event created successfully',
    });
  } catch (error: any) {
    logger.error('Create audit event failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_AUDIT_EVENT_FAILED',
        message: 'Failed to create audit event',
      },
    });
  }
};
