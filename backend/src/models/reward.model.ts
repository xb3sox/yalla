import pool from '../config/database';
import logger from '../utils/logger';

export interface RewardTransaction {
  id: string;
  user_id: string;
  points: number;
  type: 'earned' | 'redeemed' | 'expired';
  description: string;
  created_at: Date;
}

class RewardModel {
  /**
   * Get user's total points balance
   */
  async getUserPoints(userId: string): Promise<number> {
    const query = 'SELECT COALESCE(SUM(points), 0) AS total_points FROM rewards_ledger WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].total_points, 10);
  }

  /**
   * Get user's points ledger
   */
  async getTransactions(userId: string): Promise<RewardTransaction[]> {
    const query = 'SELECT * FROM rewards_ledger WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Add a transaction to the user's ledger
   */
  async addTransaction(userId: string, points: number, type: 'earned' | 'redeemed' | 'expired', description: string): Promise<RewardTransaction> {
    const query = `
      INSERT INTO rewards_ledger (user_id, points, type, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, points, type, description]);
    logger.info('Reward transaction added', { userId, points, type });
    return result.rows[0];
  }

  /**
   * Redeem points
   */
  async redeemPoints(userId: string, points: number, description: string): Promise<RewardTransaction> {
    if (points <= 0) {
      throw new Error('Points to redeem must be greater than zero');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Lock user row to prevent concurrent redemptions (double-spend)
      await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);
      
      const balanceQuery = 'SELECT COALESCE(SUM(points), 0) AS total_points FROM rewards_ledger WHERE user_id = $1';
      const balanceResult = await client.query(balanceQuery, [userId]);
      const totalPoints = parseInt(balanceResult.rows[0].total_points, 10);
      
      if (totalPoints < points) {
        throw new Error('Insufficient points balance');
      }

      const query = `
        INSERT INTO rewards_ledger (user_id, points, type, description)
        VALUES ($1, $2, 'redeemed', $3)
        RETURNING *
      `;
      const result = await client.query(query, [userId, -points, description]);
      
      await client.query('COMMIT');
      logger.info('Points redeemed successfully', { userId, points });
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default new RewardModel();
