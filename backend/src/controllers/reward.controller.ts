import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import RewardModel from '../models/reward.model';
import logger from '../utils/logger';

class RewardController {
  /**
   * Get user's rewards balance and transactions
   */
  async getRewards(req: AuthRequest, res: Response, next: NextFunction) {
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

      const userId = req.user.userId;
      
      const balance = await RewardModel.getUserPoints(userId);
      const transactions = await RewardModel.getTransactions(userId);
      
      res.status(200).json({
        success: true,
        data: {
          balance,
          transactions,
        },
      });
    } catch (error) {
      logger.error('Error fetching rewards:', error);
      next(error);
    }
  }

  /**
   * Redeem user points
   */
  async redeemRewards(req: AuthRequest, res: Response, next: NextFunction) {
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

      const userId = req.user.userId;
      const { points, description } = req.body;

      if (!points || typeof points !== 'number' || points <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid points value',
          }
        });
      }

      const transaction = await RewardModel.redeemPoints(
        userId, 
        points, 
        description || 'Points redemption'
      );

      res.status(200).json({
        success: true,
        message: 'Points redeemed successfully',
        data: {
          transaction,
        },
      });
    } catch (error: any) {
      logger.error('Error redeeming rewards:', error);
      if (error.message === 'Insufficient points balance') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_BALANCE',
            message: error.message,
          }
        });
      }
      if (error.message === 'Points to redeem must be greater than zero') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: error.message,
          }
        });
      }
      next(error);
    }
  }
}

export default new RewardController();
