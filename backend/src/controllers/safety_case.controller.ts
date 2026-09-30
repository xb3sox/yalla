import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import safetyCaseModel from '../models/safety_case.model';
import auditModel from '../models/audit.model';
import logger from '../utils/logger';

/**
 * Create a safety case
 */
export const createSafetyCase = async (req: AuthRequest, res: Response) => {
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

    const { category, category_ar, narrative, evidence } = req.body;

    if (!category || !category_ar || !narrative) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Category, category_ar, and narrative are required',
        },
      });
    }

    const safetyCase = await safetyCaseModel.create({
      reporter_id: req.user.userId,
      category,
      category_ar,
      narrative,
      evidence,
    });

    // Log audit event
    await auditModel.logSafetyCaseCreated(
      req.user.userId,
      req.user.role,
      safetyCase.id,
      category
    );

    logger.info('Safety case created', {
      caseId: safetyCase.id,
      reporterId: req.user.userId,
      category,
    });

    res.status(201).json({
      success: true,
      data: { safetyCase },
      message: 'Safety case created successfully',
    });
  } catch (error: any) {
    logger.error('Create safety case failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_SAFETY_CASE_FAILED',
        message: 'Failed to create safety case',
      },
    });
  }
};

/**
 * Get safety case by ID
 */
export const getSafetyCaseById = async (req: AuthRequest, res: Response) => {
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
    const safetyCase = await safetyCaseModel.findById(id);

    if (!safetyCase) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SAFETY_CASE_NOT_FOUND',
          message: 'Safety case not found',
        },
      });
    }

    // Check access: only reporter, trust_safety, or admin can view
    const canView =
      safetyCase.reporter_id === req.user.userId ||
      req.user.role === 'trust_safety' ||
      req.user.role === 'admin';

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this safety case',
        },
      });
    }

    res.json({
      success: true,
      data: { safetyCase },
    });
  } catch (error: any) {
    logger.error('Get safety case failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SAFETY_CASE_FAILED',
        message: 'Failed to get safety case',
      },
    });
  }
};

/**
 * Get all safety cases (trust & safety staff only)
 */
export const getAllSafetyCases = async (req: AuthRequest, res: Response) => {
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

    const { state, category, reporter_id, limit = 100, offset = 0 } = req.query;

    const filters = {
      state: state as string,
      category: category as string,
      reporter_id: reporter_id as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const safetyCases = await safetyCaseModel.findAll(filters);

    res.json({
      success: true,
      data: { safetyCases },
      meta: {
        limit: filters.limit,
        offset: filters.offset,
        count: safetyCases.length,
      },
    });
  } catch (error: any) {
    logger.error('Get all safety cases failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SAFETY_CASES_FAILED',
        message: 'Failed to get safety cases',
      },
    });
  }
};

/**
 * Update safety case (trust & safety staff only)
 */
export const updateSafetyCase = async (req: AuthRequest, res: Response) => {
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
    const updates = req.body;

    const safetyCase = await safetyCaseModel.findById(id);

    if (!safetyCase) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SAFETY_CASE_NOT_FOUND',
          message: 'Safety case not found',
        },
      });
    }

    // Validate state transition if state is being updated
    if (updates.state) {
      const validTransitions: Record<string, string[]> = {
        submitted: ['triage', 'under_review', 'closed'],
        triage: ['under_review', 'closed'],
        under_review: ['action_taken', 'closed'],
        action_taken: ['closed', 'appealed'],
        closed: ['appealed'],
        appealed: ['final'],
        final: [],
      };

      if (!validTransitions[safetyCase.state]?.includes(updates.state)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATE_TRANSITION',
            message: `Cannot transition from ${safetyCase.state} to ${updates.state}`,
          },
        });
      }
    }

    const updated = await safetyCaseModel.update(id, updates);

    // Log audit event
    await auditModel.create({
      actor_id: req.user.userId,
      actor_role: req.user.role,
      action: 'safety_case_updated',
      resource_type: 'safety_case',
      resource_id: id,
      details: { updates },
      classification: 'restricted',
    });

    logger.info('Safety case updated', {
      caseId: id,
      updates,
      staffId: req.user.userId,
    });

    res.json({
      success: true,
      data: { safetyCase: updated },
      message: 'Safety case updated successfully',
    });
  } catch (error: any) {
    logger.error('Update safety case failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_SAFETY_CASE_FAILED',
        message: 'Failed to update safety case',
      },
    });
  }
};

/**
 * Add action to safety case
 */
export const addActionToSafetyCase = async (req: AuthRequest, res: Response) => {
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
    const { action_type, description, metadata } = req.body;

    if (!action_type || !description) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'action_type and description are required',
        },
      });
    }

    const safetyCase = await safetyCaseModel.findById(id);

    if (!safetyCase) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SAFETY_CASE_NOT_FOUND',
          message: 'Safety case not found',
        },
      });
    }

    const updated = await safetyCaseModel.addAction(id, {
      action_type,
      description,
      actor_id: req.user.userId,
      metadata,
    });

    // Log audit event
    await auditModel.create({
      actor_id: req.user.userId,
      actor_role: req.user.role,
      action: 'safety_case_action_added',
      resource_type: 'safety_case',
      resource_id: id,
      details: { action_type, description },
      classification: 'restricted',
    });

    logger.info('Action added to safety case', {
      caseId: id,
      actionType: action_type,
      staffId: req.user.userId,
    });

    res.json({
      success: true,
      data: { safetyCase: updated },
      message: 'Action added successfully',
    });
  } catch (error: any) {
    logger.error('Add action to safety case failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'ADD_ACTION_FAILED',
        message: 'Failed to add action to safety case',
      },
    });
  }
};

/**
 * Get safety case statistics
 */
export const getSafetyCaseStatistics = async (req: AuthRequest, res: Response) => {
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

    const statistics = await safetyCaseModel.getStatistics();

    res.json({
      success: true,
      data: { statistics },
    });
  } catch (error: any) {
    logger.error('Get safety case statistics failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_STATISTICS_FAILED',
        message: 'Failed to get safety case statistics',
      },
    });
  }
};

/**
 * Delete safety case (admin only)
 */
export const deleteSafetyCase = async (req: AuthRequest, res: Response) => {
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
          message: 'Only admins can delete safety cases',
        },
      });
    }

    const { id } = req.params;

    const safetyCase = await safetyCaseModel.findById(id);

    if (!safetyCase) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SAFETY_CASE_NOT_FOUND',
          message: 'Safety case not found',
        },
      });
    }

    await safetyCaseModel.delete(id);

    // Log audit event
    await auditModel.create({
      actor_id: req.user.userId,
      actor_role: req.user.role,
      action: 'safety_case_deleted',
      resource_type: 'safety_case',
      resource_id: id,
      details: {},
      classification: 'restricted',
    });

    logger.info('Safety case deleted', {
      caseId: id,
      adminId: req.user.userId,
    });

    res.json({
      success: true,
      message: 'Safety case deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete safety case failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_SAFETY_CASE_FAILED',
        message: 'Failed to delete safety case',
      },
    });
  }
};
