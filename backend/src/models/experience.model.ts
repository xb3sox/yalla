import pool from '../config/database';
import logger from '../utils/logger';

export interface Experience {
  id: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  date: string;
  time: string;
  duration: string;
  duration_minutes: number;
  area: string;
  area_ar: string;
  group_size_min: number;
  group_size_max: number;
  language: string;
  price: number;
  currency: string;
  included: string[];
  included_ar: string[];
  excluded: string[];
  excluded_ar: string[];
  accessibility: string;
  accessibility_ar: string;
  physical_demand: string;
  environment: string;
  environment_ar: string;
  noise_level: string;
  host_role: string;
  host_role_ar: string;
  requirements: string[];
  requirements_ar: string[];
  cancellation_summary: string;
  cancellation_summary_ar: string;
  image_url: string;
  plan_state: string;
  capacity: number;
  booked: number;
  primary_host_id?: string;
  backup_host_id?: string;
  primary_venue_id?: string;
  fallback_venue_id?: string;
  min_attendance: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateExperienceInput {
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  date: string;
  time: string;
  duration: string;
  duration_minutes: number;
  area: string;
  area_ar: string;
  group_size_min: number;
  group_size_max: number;
  language: string;
  price: number;
  currency?: string;
  included?: string[];
  included_ar?: string[];
  excluded?: string[];
  excluded_ar?: string[];
  accessibility?: string;
  accessibility_ar?: string;
  physical_demand?: string;
  environment?: string;
  environment_ar?: string;
  noise_level?: string;
  host_role?: string;
  host_role_ar?: string;
  requirements?: string[];
  requirements_ar?: string[];
  cancellation_summary?: string;
  cancellation_summary_ar?: string;
  image_url?: string;
  plan_state?: string;
  capacity: number;
  primary_host_id?: string;
  backup_host_id?: string;
  primary_venue_id?: string;
  fallback_venue_id?: string;
  min_attendance?: number;
}

class ExperienceModel {
  /**
   * Create a new experience
   */
  async create(input: CreateExperienceInput): Promise<Experience> {
    const query = `
      INSERT INTO experiences (
        title, title_ar, description, description_ar, date, time, duration,
        duration_minutes, area, area_ar, group_size_min, group_size_max,
        language, price, currency, included, included_ar, excluded, excluded_ar,
        accessibility, accessibility_ar, physical_demand, environment, environment_ar,
        noise_level, host_role, host_role_ar, requirements, requirements_ar,
        cancellation_summary, cancellation_summary_ar, image_url, capacity, min_attendance
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
        $30, $31, $32, $33, $34
      )
      RETURNING *
    `;
    
    const values = [
      input.title,
      input.title_ar,
      input.description,
      input.description_ar,
      input.date,
      input.time,
      input.duration,
      input.duration_minutes,
      input.area,
      input.area_ar,
      input.group_size_min,
      input.group_size_max,
      input.language,
      input.price,
      input.currency || 'SAR',
      JSON.stringify(input.included || []),
      JSON.stringify(input.included_ar || []),
      JSON.stringify(input.excluded || []),
      JSON.stringify(input.excluded_ar || []),
      input.accessibility || '',
      input.accessibility_ar || '',
      input.physical_demand || 'moderate',
      input.environment || '',
      input.environment_ar || '',
      input.noise_level || 'moderate',
      input.host_role || '',
      input.host_role_ar || '',
      JSON.stringify(input.requirements || []),
      JSON.stringify(input.requirements_ar || []),
      input.cancellation_summary || '',
      input.cancellation_summary_ar || '',
      input.image_url || '',
      input.capacity,
      input.min_attendance || 4,
    ];
    
    const result = await pool.query(query, values);
    logger.info('Experience created', { experienceId: result.rows[0].id });
    
    return result.rows[0];
  }

  /**
   * Find experience by ID
   */
  async findById(id: string): Promise<Experience | null> {
    const query = 'SELECT * FROM experiences WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    return result.rows[0] || null;
  }

  /**
   * Get all published experiences
   */
  async findAllPublished(limit: number = 50, offset: number = 0): Promise<Experience[]> {
    const query = `
      SELECT * FROM experiences
      WHERE plan_state = 'published'
      ORDER BY date DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Search experiences
   */
  async search(filters: {
    query?: string;
    area?: string;
    minPrice?: number;
    maxPrice?: number;
    language?: string;
    date?: string;
  }): Promise<Experience[]> {
    let query = 'SELECT * FROM experiences WHERE plan_state = \'published\'';
    const values: any[] = [];
    let paramCount = 1;
    
    if (filters.query) {
      query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount} OR title_ar ILIKE $${paramCount} OR description_ar ILIKE $${paramCount})`;
      values.push(`%${filters.query}%`);
      paramCount++;
    }
    
    if (filters.area) {
      query += ` AND (area ILIKE $${paramCount} OR area_ar ILIKE $${paramCount})`;
      values.push(`%${filters.area}%`);
      paramCount++;
    }
    
    if (filters.minPrice !== undefined) {
      query += ` AND price >= $${paramCount}`;
      values.push(filters.minPrice);
      paramCount++;
    }
    
    if (filters.maxPrice !== undefined) {
      query += ` AND price <= $${paramCount}`;
      values.push(filters.maxPrice);
      paramCount++;
    }
    
    if (filters.language) {
      query += ` AND language = $${paramCount}`;
      values.push(filters.language);
      paramCount++;
    }
    
    if (filters.date) {
      query += ` AND date = $${paramCount}`;
      values.push(filters.date);
      paramCount++;
    }
    
    query += ' ORDER BY date DESC';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Update experience
   */
  async update(id: string, updates: Partial<CreateExperienceInput>): Promise<Experience> {
    const updates_list: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        updates_list.push(`${key} = $${paramCount}`);
        values.push(Array.isArray(value) ? JSON.stringify(value) : value);
        paramCount++;
      }
    }
    
    updates_list.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const query = `
      UPDATE experiences
      SET ${updates_list.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    logger.info('Experience updated', { experienceId: id });
    
    return result.rows[0];
  }

  /**
   * Delete experience
   */
  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM experiences WHERE id = $1';
    await pool.query(query, [id]);
    logger.info('Experience deleted', { experienceId: id });
  }

  /**
   * Increment booked count
   */
  async incrementBooked(id: string): Promise<void> {
    const query = `
      UPDATE experiences
      SET booked = booked + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  /**
   * Decrement booked count
   */
  async decrementBooked(id: string): Promise<void> {
    const query = `
      UPDATE experiences
      SET booked = GREATEST(booked - 1, 0), updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }
}

export default new ExperienceModel();
