import pool from '../config/database';
import logger from '../utils/logger';

export const EXPERIENCE_TRANSITIONS: Record<string, string[]> = {
  draft: ['review', 'cancelled'],
  review: ['published', 'cancelled'],
  published: ['full', 'changed', 'cancelled'],
  full: ['in_progress', 'cancelled'],
  changed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['archived'],
  archived: [],
  cancelled: [],
};

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
  capacity: number;
  min_attendance?: number;
  plan_state?: string;
  primary_host_id?: string;
  backup_host_id?: string;
  primary_venue_id?: string;
  fallback_venue_id?: string;
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
    
    const anyIn = input as any;
    const values = [
      input.title,
      input.title_ar || anyIn.titleAr || '',
      input.description,
      input.description_ar || anyIn.descriptionAr || '',
      input.date,
      input.time,
      input.duration,
      input.duration_minutes ?? anyIn.durationMinutes ?? 60,
      input.area,
      input.area_ar || anyIn.areaAr || '',
      input.group_size_min ?? anyIn.groupSizeMin ?? 1,
      input.group_size_max ?? anyIn.groupSizeMax ?? input.capacity ?? 10,
      input.language,
      input.price,
      input.currency || anyIn.currency || 'SAR',
      JSON.stringify(input.included || anyIn.included || []),
      JSON.stringify(input.included_ar || anyIn.includedAr || []),
      JSON.stringify(input.excluded || anyIn.excluded || []),
      JSON.stringify(input.excluded_ar || anyIn.excludedAr || []),
      input.accessibility || anyIn.accessibility || '',
      input.accessibility_ar || anyIn.accessibilityAr || '',
      input.physical_demand || anyIn.physicalDemand || 'moderate',
      input.environment || anyIn.environment || '',
      input.environment_ar || anyIn.environmentAr || '',
      input.noise_level || anyIn.noiseLevel || 'moderate',
      input.host_role || anyIn.hostRole || '',
      input.host_role_ar || anyIn.hostRoleAr || '',
      JSON.stringify(input.requirements || anyIn.requirements || []),
      JSON.stringify(input.requirements_ar || anyIn.requirementsAr || []),
      input.cancellation_summary || anyIn.cancellationSummary || '',
      input.cancellation_summary_ar || anyIn.cancellationSummaryAr || '',
      input.image_url || anyIn.imageUrl || '',
      input.capacity,
      input.min_attendance ?? anyIn.minAttendance ?? 4,
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
   * Staff search experiences (multi-field search)
   */
  async staffSearch(filters: {
    searchQuery?: string;
    city?: string;
    status?: string;
    minSpots?: number;
    maxPrice?: number;
  }): Promise<Experience[]> {
    let query = 'SELECT * FROM experiences WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;
    
    if (filters.searchQuery) {
      query += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount} OR title_ar ILIKE $${paramCount} OR description_ar ILIKE $${paramCount})`;
      values.push(`%${filters.searchQuery}%`);
      paramCount++;
    }
    
    if (filters.city) {
      query += ` AND (area ILIKE $${paramCount} OR area_ar ILIKE $${paramCount})`;
      values.push(`%${filters.city}%`);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND plan_state = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }
    
    if (filters.minSpots !== undefined) {
      query += ` AND (capacity - booked) >= $${paramCount}`;
      values.push(filters.minSpots);
      paramCount++;
    }
    
    if (filters.maxPrice !== undefined) {
      query += ` AND price <= $${paramCount}`;
      values.push(filters.maxPrice);
      paramCount++;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  /**
   * Update experience
   */
  async update(id: string, updates: Partial<CreateExperienceInput> | Record<string, any>): Promise<Experience> {
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
