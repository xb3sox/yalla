import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import config from '../config';
import logger from '../utils/logger';

export interface User {
  id: string;
  phone: string;
  display_name: string;
  password_hash: string;
  language: string;
  preferred_area?: string;
  experience_language: string;
  budget_min: number;
  budget_max: number;
  accessibility_needs?: string;
  adult_declaration_accepted: boolean;
  terms_accepted: boolean;
  marketing_consent: boolean;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  phone: string;
  display_name: string;
  password: string;
  language?: string;
  preferred_area?: string;
  experience_language?: string;
  budget_min?: number;
  budget_max?: number;
  accessibility_needs?: string;
  adult_declaration_accepted: boolean;
  terms_accepted: boolean;
  marketing_consent?: boolean;
}

export interface LoginInput {
  phone: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class UserModel {
  /**
   * Create a new user
   */
  async create(input: CreateUserInput): Promise<User> {
    const passwordHash = await bcrypt.hash(input.password, config.security.bcryptRounds);
    
    const query = `
      INSERT INTO users (
        phone, display_name, password_hash, language, preferred_area,
        experience_language, budget_min, budget_max, accessibility_needs,
        adult_declaration_accepted, terms_accepted, marketing_consent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    
    const values = [
      input.phone,
      input.display_name,
      passwordHash,
      input.language || 'en',
      input.preferred_area,
      input.experience_language || 'en',
      input.budget_min || 100,
      input.budget_max || 400,
      input.accessibility_needs,
      input.adult_declaration_accepted,
      input.terms_accepted,
      input.marketing_consent || false,
    ];
    
    const result = await pool.query(query, values);
    logger.info('User created', { userId: result.rows[0].id, phone: input.phone });
    
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1 AND is_active = TRUE';
    const result = await pool.query(query, [id]);
    
    return result.rows[0] || null;
  }

  /**
   * Find user by phone
   */
  async findByPhone(phone: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE phone = $1 AND is_active = TRUE';
    const result = await pool.query(query, [phone]);
    
    return result.rows[0] || null;
  }

  /**
   * Authenticate user and generate tokens
   */
  async login(input: LoginInput): Promise<{ user: User; tokens: AuthTokens }> {
    const user = await this.findByPhone(input.phone);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    const isValidPassword = await bcrypt.compare(input.password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    const tokens = this.generateTokens(user);
    
    logger.info('User logged in', { userId: user.id });
    
    return { user, tokens };
  }

  /**
   * Generate JWT tokens
   */
  generateTokens(user: User): AuthTokens {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
        role: user.role,
      },
      config.jwt.secret as jwt.Secret,
      { expiresIn: config.jwt.expiresIn as any }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret as jwt.Secret,
      { expiresIn: config.jwt.refreshExpiresIn as any }
    );
    
    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): any {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      const user = await this.findById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    preferences: {
      language?: string;
      preferred_area?: string;
      experience_language?: string;
      budget_min?: number;
      budget_max?: number;
      accessibility_needs?: string;
    }
  ): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (preferences.language !== undefined) {
      updates.push(`language = $${paramCount++}`);
      values.push(preferences.language);
    }
    
    if (preferences.preferred_area !== undefined) {
      updates.push(`preferred_area = $${paramCount++}`);
      values.push(preferences.preferred_area);
    }
    
    if (preferences.experience_language !== undefined) {
      updates.push(`experience_language = $${paramCount++}`);
      values.push(preferences.experience_language);
    }
    
    if (preferences.budget_min !== undefined) {
      updates.push(`budget_min = $${paramCount++}`);
      values.push(preferences.budget_min);
    }
    
    if (preferences.budget_max !== undefined) {
      updates.push(`budget_max = $${paramCount++}`);
      values.push(preferences.budget_max);
    }
    
    if (preferences.accessibility_needs !== undefined) {
      updates.push(`accessibility_needs = $${paramCount++}`);
      values.push(preferences.accessibility_needs);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);
    
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    logger.info('User preferences updated', { userId });
    
    return result.rows[0];
  }

  /**
   * Delete user (soft delete)
   */
  async delete(userId: string): Promise<void> {
    const query = 'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1';
    await pool.query(query, [userId]);
    logger.info('User deleted', { userId });
  }

  /**
   * Get user data for export
   */
  async exportData(userId: string): Promise<any> {
    const user = await this.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get user's reservations
    const reservationsQuery = `
      SELECT r.*, e.title, e.title_ar, e.date, e.time
      FROM reservations r
      JOIN experiences e ON r.experience_id = e.id
      WHERE r.participant_id = $1
      ORDER BY r.created_at DESC
    `;
    const reservations = await pool.query(reservationsQuery, [userId]);
    
    // Get user's feedbacks
    const feedbacksQuery = `
      SELECT f.*, e.title, e.title_ar
      FROM feedbacks f
      JOIN experiences e ON f.experience_id = e.id
      WHERE f.participant_id = $1
      ORDER BY f.created_at DESC
    `;
    const feedbacks = await pool.query(feedbacksQuery, [userId]);
    
    // Get user's favorites
    const favoritesQuery = `
      SELECT e.*
      FROM favorites f
      JOIN experiences e ON f.experience_id = e.id
      WHERE f.user_id = $1
      ORDER BY f.created_at DESC
    `;
    const favorites = await pool.query(favoritesQuery, [userId]);
    
    return {
      user: {
        id: user.id,
        phone: user.phone,
        display_name: user.display_name,
        language: user.language,
        preferences: {
          preferred_area: user.preferred_area,
          experience_language: user.experience_language,
          budget_min: user.budget_min,
          budget_max: user.budget_max,
          accessibility_needs: user.accessibility_needs,
        },
        created_at: user.created_at,
      },
      reservations: reservations.rows,
      feedbacks: feedbacks.rows,
      favorites: favorites.rows,
      exported_at: new Date().toISOString(),
    };
  }
}

export default new UserModel();
