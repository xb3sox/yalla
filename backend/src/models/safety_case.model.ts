import pool, { transaction } from '../config/database';
import logger from '../utils/logger';

export interface SafetyCase {
  id: string;
  reporter_id: string;
  state: string;
  category: string;
  category_ar: string;
  narrative: string;
  evidence: any;
  actions: any;
  restricted_access: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSafetyCaseInput {
  reporter_id: string;
  category: string;
  category_ar: string;
  narrative: string;
  evidence?: any;
}

export interface UpdateSafetyCaseInput {
  state?: string;
  category?: string;
  category_ar?: string;
  narrative?: string;
  evidence?: any;
  actions?: any;
}

export const SAFETY_CASE_TRANSITIONS: Record<string, string[]> = {
  submitted: ['triage', 'under_review', 'closed'],
  triage: ['under_review', 'closed'],
  under_review: ['action_taken', 'closed'],
  action_taken: ['closed', 'appealed'],
  closed: ['appealed'],
  appealed: ['final'],
  final: [],
};

class SafetyCaseModel {
  /**
   * Create a safety case
   */
  async create(input: CreateSafetyCaseInput): Promise<SafetyCase> {
    const query = `
      INSERT INTO safety_cases (
        reporter_id, state, category, category_ar, narrative, evidence, actions, restricted_access
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const anyIn = input as any;
    const values = [
      input.reporter_id || anyIn.reporterId,
      'submitted',
      input.category,
      input.category_ar || anyIn.categoryAr || '',
      input.narrative,
      JSON.stringify(input.evidence || []),
      JSON.stringify([]),
      true, // Always restricted access
    ];
    
    const result = await pool.query(query, values);
    logger.info('Safety case created', { 
      caseId: result.rows[0].id,
      reporterId: input.reporter_id,
      category: input.category 
    });
    
    return result.rows[0];
  }

  /**
   * Find safety case by ID
   */
  async findById(id: string): Promise<SafetyCase | null> {
    const query = 'SELECT * FROM safety_cases WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    return result.rows[0] || null;
  }

  /**
   * Get all safety cases (for trust & safety staff)
   */
  async findAll(rawFilters: {
    state?: string;
    category?: string;
    reporter_id?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<SafetyCase[]> {
    const filters = {
      ...rawFilters,
      reporter_id: rawFilters.reporter_id || (rawFilters as any).reporterId,
    };
    let query = 'SELECT * FROM safety_cases WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (filters.state) {
      query += ` AND state = $${paramCount}`;
      values.push(filters.state);
      paramCount++;
    }

    if (filters.category) {
      query += ` AND category = $${paramCount}`;
      values.push(filters.category);
      paramCount++;
    }

    if (filters.reporter_id) {
      query += ` AND reporter_id = $${paramCount}`;
      values.push(filters.reporter_id);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
      paramCount++;
    }

    const result = await pool.query(query, values);
    
    return result.rows;
  }

  /**
   * Update safety case
   */
  async update(id: string, updates: UpdateSafetyCaseInput): Promise<SafetyCase> {
    return await transaction(async (client) => {
      const updates_list: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (updates.state !== undefined) {
        updates_list.push(`state = $${paramCount}`);
        values.push(updates.state);
        paramCount++;
      }

      if (updates.category !== undefined) {
        updates_list.push(`category = $${paramCount}`);
        values.push(updates.category);
        paramCount++;
      }

      const categoryAr = updates.category_ar ?? (updates as any).categoryAr;
      if (categoryAr !== undefined) {
        updates_list.push(`category_ar = $${paramCount}`);
        values.push(categoryAr);
        paramCount++;
      }

      if (updates.narrative !== undefined) {
        updates_list.push(`narrative = $${paramCount}`);
        values.push(updates.narrative);
        paramCount++;
      }

      if (updates.evidence !== undefined) {
        updates_list.push(`evidence = $${paramCount}`);
        values.push(JSON.stringify(updates.evidence));
        paramCount++;
      }

      if (updates.actions !== undefined) {
        updates_list.push(`actions = $${paramCount}`);
        values.push(JSON.stringify(updates.actions));
        paramCount++;
      }

      updates_list.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const query = `
        UPDATE safety_cases
        SET ${updates_list.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Safety case not found');
      }

      logger.info('Safety case updated', { caseId: id, updates });

      return result.rows[0];
    });
  }

  /**
   * Add action to safety case
   */
  async addAction(caseId: string, action: {
    action_type: string;
    description: string;
    actor_id: string;
    metadata?: any;
  }): Promise<SafetyCase> {
    const safetyCase = await this.findById(caseId);

    if (!safetyCase) {
      throw new Error('Safety case not found');
    }

    const currentActions = typeof safetyCase.actions === 'string' ? JSON.parse(safetyCase.actions) : safetyCase.actions || [];
    const newAction = {
      ...action,
      timestamp: new Date().toISOString(),
    };

    const updatedActions = [...currentActions, newAction];

    return await this.update(caseId, { actions: updatedActions });
  }

  /**
   * Add evidence to safety case
   */
  async addEvidence(caseId: string, evidenceItem: any): Promise<SafetyCase> {
    const safetyCase = await this.findById(caseId);

    if (!safetyCase) {
      throw new Error('Safety case not found');
    }

    const currentEvidence = typeof safetyCase.evidence === 'string' ? JSON.parse(safetyCase.evidence) : safetyCase.evidence || [];
    const updatedEvidence = [...currentEvidence, evidenceItem];

    return await this.update(caseId, { evidence: updatedEvidence });
  }

  /**
   * Get safety cases by reporter
   */
  async findByReporter(reporterId: string): Promise<SafetyCase[]> {
    const query = `
      SELECT * FROM safety_cases
      WHERE reporter_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [reporterId]);
    
    return result.rows;
  }

  /**
   * Get safety case statistics
   */
  async getStatistics(): Promise<any> {
    const query = `
      SELECT 
        state,
        COUNT(*)::int as count
      FROM safety_cases
      GROUP BY state
      ORDER BY count DESC
    `;
    const result = await pool.query(query);
    
    return result.rows;
  }

  /**
   * Delete safety case (admin only)
   */
  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM safety_cases WHERE id = $1';
    const result = await pool.query(query, [id]);

    if (result.rowCount === 0) {
      throw new Error('Safety case not found');
    }

    logger.info('Safety case deleted', { caseId: id });
  }

  /**
   * Update safety case state
   */
  async updateState(caseId: string, newState: string): Promise<SafetyCase> {
    const safetyCase = await this.findById(caseId);

    if (!safetyCase) {
      throw new Error('Safety case not found');
    }

    if (!SAFETY_CASE_TRANSITIONS[safetyCase.state]?.includes(newState)) {
      throw new Error('Invalid state transition');
    }

    return await this.update(caseId, { state: newState });
  }
}

export default new SafetyCaseModel();
