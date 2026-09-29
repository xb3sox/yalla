import pool from '../config/database';
import logger from '../utils/logger';

export interface AuditEvent {
  id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  timestamp: Date;
  classification: string;
}

export interface CreateAuditEventInput {
  actor_id: string;
  actor_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: any;
  classification?: string;
}

class AuditModel {
  /**
   * Create an audit event
   */
  async create(input: CreateAuditEventInput): Promise<AuditEvent> {
    const query = `
      INSERT INTO audit_events (
        actor_id, actor_role, action, resource_type, resource_id, details, classification
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      input.actor_id,
      input.actor_role,
      input.action,
      input.resource_type,
      input.resource_id,
      JSON.stringify(input.details || {}),
      input.classification || 'internal',
    ];
    
    const result = await pool.query(query, values);
    
    logger.info('Audit event created', { 
      auditId: result.rows[0].id,
      actorId: input.actor_id,
      action: input.action,
      resourceType: input.resource_type 
    });
    
    return result.rows[0];
  }

  /**
   * Get audit events with filters
   */
  async findAll(filters: {
    actor_id?: string;
    action?: string;
    resource_type?: string;
    resource_id?: string;
    classification?: string;
    start_date?: Date;
    end_date?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditEvent[]> {
    let query = 'SELECT * FROM audit_events WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (filters.actor_id) {
      query += ` AND actor_id = $${paramCount}`;
      values.push(filters.actor_id);
      paramCount++;
    }

    if (filters.action) {
      query += ` AND action = $${paramCount}`;
      values.push(filters.action);
      paramCount++;
    }

    if (filters.resource_type) {
      query += ` AND resource_type = $${paramCount}`;
      values.push(filters.resource_type);
      paramCount++;
    }

    if (filters.resource_id) {
      query += ` AND resource_id = $${paramCount}`;
      values.push(filters.resource_id);
      paramCount++;
    }

    if (filters.classification) {
      query += ` AND classification = $${paramCount}`;
      values.push(filters.classification);
      paramCount++;
    }

    if (filters.start_date) {
      query += ` AND timestamp >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      query += ` AND timestamp <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    query += ' ORDER BY timestamp DESC';

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
   * Get audit events for a specific resource
   */
  async findByResource(resourceType: string, resourceId: string): Promise<AuditEvent[]> {
    const query = `
      SELECT * FROM audit_events
      WHERE resource_type = $1 AND resource_id = $2
      ORDER BY timestamp DESC
    `;
    const result = await pool.query(query, [resourceType, resourceId]);
    
    return result.rows;
  }

  /**
   * Get audit events for a specific actor
   */
  async findByActor(actorId: string, limit: number = 100): Promise<AuditEvent[]> {
    const query = `
      SELECT * FROM audit_events
      WHERE actor_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [actorId, limit]);
    
    return result.rows;
  }

  /**
   * Log user login
   */
  async logLogin(userId: string, role: string, ipAddress?: string): Promise<AuditEvent> {
    return await this.create({
      actor_id: userId,
      actor_role: role,
      action: 'user_login',
      resource_type: 'user',
      resource_id: userId,
      details: { ip_address: ipAddress },
      classification: 'internal',
    });
  }

  /**
   * Log user logout
   */
  async logLogout(userId: string, role: string): Promise<AuditEvent> {
    return await this.create({
      actor_id: userId,
      actor_role: role,
      action: 'user_logout',
      resource_type: 'user',
      resource_id: userId,
      classification: 'internal',
    });
  }

  /**
   * Log reservation creation
   */
  async logReservationCreated(userId: string, role: string, reservationId: string, experienceId: string): Promise<AuditEvent> {
    return await this.create({
      actor_id: userId,
      actor_role: role,
      action: 'reservation_created',
      resource_type: 'reservation',
      resource_id: reservationId,
      details: { experience_id: experienceId },
      classification: 'confidential',
    });
  }

  /**
   * Log reservation cancellation
   */
  async logReservationCancelled(userId: string, role: string, reservationId: string, reason?: string): Promise<AuditEvent> {
    return await this.create({
      actor_id: userId,
      actor_role: role,
      action: 'reservation_cancelled',
      resource_type: 'reservation',
      resource_id: reservationId,
      details: { reason },
      classification: 'confidential',
    });
  }

  /**
   * Log payment created
   */
  async logPaymentCreated(userId: string, role: string, paymentId: string, reservationId: string, amount: number): Promise<AuditEvent> {
    return await this.create({
      actor_id: userId,
      actor_role: role,
      action: 'payment_created',
      resource_type: 'payment',
      resource_id: paymentId,
      details: { reservation_id: reservationId, amount },
      classification: 'restricted',
    });
  }

  /**
   * Log refund processed
   */
  async logRefundProcessed(userId: string, role: string, paymentId: string, amount: number): Promise<AuditEvent> {
    return await this.create({
      actor_id: userId,
      actor_role: role,
      action: 'refund_processed',
      resource_type: 'payment',
      resource_id: paymentId,
      details: { amount },
      classification: 'restricted',
    });
  }

  /**
   * Log experience created
   */
  async logExperienceCreated(userId: string, role: string, experienceId: string, title: string): Promise<AuditEvent> {
    return await this.create({
      actor_id: userId,
      actor_role: role,
      action: 'experience_created',
      resource_type: 'experience',
      resource_id: experienceId,
      details: { title },
      classification: 'internal',
    });
  }

  /**
   * Log experience updated
   */
  async logExperienceUpdated(userId: string, role: string, experienceId: string, changes: any): Promise<AuditEvent> {
    return await this.create({
      actor_id: userId,
      actor_role: role,
      action: 'experience_updated',
      resource_type: 'experience',
      resource_id: experienceId,
      details: { changes },
      classification: 'internal',
    });
  }

  /**
   * Log user blocked
   */
  async logUserBlocked(blockerId: string, role: string, blockedUserId: string, reason?: string): Promise<AuditEvent> {
    return await this.create({
      actor_id: blockerId,
      actor_role: role,
      action: 'user_blocked',
      resource_type: 'block',
      resource_id: blockedUserId,
      details: { reason },
      classification: 'restricted',
    });
  }

  /**
   * Log safety case created
   */
  async logSafetyCaseCreated(reporterId: string, role: string, caseId: string, category: string): Promise<AuditEvent> {
    return await this.create({
      actor_id: reporterId,
      actor_role: role,
      action: 'safety_case_created',
      resource_type: 'safety_case',
      resource_id: caseId,
      details: { category },
      classification: 'restricted',
    });
  }

  /**
   * Get audit statistics
   */
  async getStatistics(startDate?: Date, endDate?: Date): Promise<any> {
    let query = `
      SELECT 
        action,
        COUNT(*) as count,
        MIN(timestamp) as first_occurrence,
        MAX(timestamp) as last_occurrence
      FROM audit_events
      WHERE 1=1
    `;
    
    const values: any[] = [];
    let paramCount = 1;

    if (startDate) {
      query += ` AND timestamp >= $${paramCount}`;
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramCount}`;
      values.push(endDate);
      paramCount++;
    }

    query += ' GROUP BY action ORDER BY count DESC';

    const result = await pool.query(query, values);
    
    return result.rows;
  }
}

export default new AuditModel();
