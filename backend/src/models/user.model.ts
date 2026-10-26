import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import config from '../config';
import logger from '../utils/logger';

export interface User {
  id: string;
  phone: string;
  display_name: string;
  displayName?: string;
  password_hash: string;
  passwordHash?: string;
  language: string;
  preferred_area?: string;
  preferredArea?: string;
  experience_language: string;
  experienceLanguage?: string;
  budget_min: number;
  budgetMin?: number;
  budget_max: number;
  budgetMax?: number;
  accessibility_needs?: string;
  accessibilityNeeds?: string;
  adult_declaration_accepted: boolean;
  adultDeclarationAccepted?: boolean;
  terms_accepted: boolean;
  termsAccepted?: boolean;
  marketing_consent: boolean;
  marketingConsent?: boolean;
  role: string;
  is_active: boolean;
  isActive?: boolean;
  created_at: Date;
  createdAt?: Date;
  updated_at: Date;
  updatedAt?: Date;
}

export interface CreateUserInput {
  phone: string;
  display_name?: string;
  displayName?: string;
  password: string;
  language?: string;
  preferred_area?: string;
  preferredArea?: string;
  experience_language?: string;
  experienceLanguage?: string;
  budget_min?: number;
  budgetMin?: number;
  budget_max?: number;
  budgetMax?: number;
  accessibility_needs?: string;
  accessibilityNeeds?: string;
  adult_declaration_accepted?: boolean;
  adultDeclarationAccepted?: boolean;
  terms_accepted?: boolean;
  termsAccepted?: boolean;
  marketing_consent?: boolean;
  marketingConsent?: boolean;
}

export interface LoginInput {
  phone: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}


export function mapUserRow(row: any): User | null {
  if (!row) return null;
  return {
    ...row,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    preferredArea: row.preferred_area,
    experienceLanguage: row.experience_language,
    budgetMin: row.budget_min !== undefined && row.budget_min !== null ? Number(row.budget_min) : undefined,
    budgetMax: row.budget_max !== undefined && row.budget_max !== null ? Number(row.budget_max) : undefined,
    accessibilityNeeds: row.accessibility_needs,
    adultDeclarationAccepted: row.adult_declaration_accepted,
    termsAccepted: row.terms_accepted,
    marketingConsent: row.marketing_consent,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
    
    const displayName = input.display_name || input.displayName || '';
    const adultDeclarationAccepted = input.adult_declaration_accepted ?? input.adultDeclarationAccepted ?? true;
    const termsAccepted = input.terms_accepted ?? input.termsAccepted ?? true;
    const preferredArea = input.preferred_area || input.preferredArea;
    const experienceLanguage = input.experience_language || input.experienceLanguage || 'en';
    const budgetMin = input.budget_min ?? input.budgetMin ?? 100;
    const budgetMax = input.budget_max ?? input.budgetMax ?? 400;
    const accessibilityNeeds = input.accessibility_needs || input.accessibilityNeeds;
    const marketingConsent = input.marketing_consent ?? input.marketingConsent ?? false;

    const values = [
      input.phone,
      displayName,
      passwordHash,
      input.language || 'en',
      preferredArea,
      experienceLanguage,
      budgetMin,
      budgetMax,
      accessibilityNeeds,
      adultDeclarationAccepted,
      termsAccepted,
      marketingConsent,
    ];
    
    const result = await pool.query(query, values);
    logger.info('User created', { userId: result.rows[0].id, phone: input.phone });
    
    return mapUserRow(result.rows[0])!;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1 AND is_active = TRUE';
    const result = await pool.query(query, [id]);
    
    return mapUserRow(result.rows[0]);
  }

  /**
   * Find user by phone
   */
  async findByPhone(phone: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE phone = $1 AND is_active = TRUE';
    const result = await pool.query(query, [phone]);
    
    return mapUserRow(result.rows[0]);
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
    
    return mapUserRow(result.rows[0])!;
  }

  /**
   * Delete user (soft delete)
   */
  async delete(userId: string): Promise<void> {
    const query = 'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id::text = $1 OR phone = $1';
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
