import { Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import privacyService from '../services/privacy.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { clearCookieOptions } from './auth.controller';
import logger from '../utils/logger';

export const deleteAccountSchema = z.object({
  body: z.object({
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    confirm: z.boolean().optional(),
  }),
});

/**
 * GET /api/v1/user/export-data
 * Export machine-readable personal data archive
 */
export const exportData = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const data = await privacyService.exportUserData(req.user.userId);

    const download = req.query.download === 'true' || req.query.format === 'file';
    if (download) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="yalla_user_data_${req.user.userId}.json"`
      );
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('Data export failed', { error: error.message, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_FAILED',
        message: 'Failed to export user data',
      },
    });
  }
};

/**
 * POST /api/v1/user/delete-account
 * Request account erasure and anonymization
 */
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    const userId = req.user.userId;
    const { password, confirmPassword, confirm } = req.body || {};

    // Verify confirmation
    const userRes = await pool.query('SELECT password_hash FROM users WHERE id::text = $1', [userId]);
    const user = userRes.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    const passToVerify = password || confirmPassword;
    if (passToVerify) {
      const isMatch = await bcrypt.compare(passToVerify, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Incorrect password confirmation',
          },
        });
      }
    } else if (confirm !== true) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONFIRMATION_REQUIRED',
          message: 'Password confirmation or explicit deletion agreement is required',
        },
      });
    }

    await privacyService.anonymizeAndDeleteAccount(userId, req.ip, req.user.role);

    res.clearCookie('access_token', clearCookieOptions);
    res.clearCookie('refresh_token', clearCookieOptions);

    res.json({
      success: true,
      message: 'Account successfully deleted and anonymized',
    });
  } catch (error: any) {
    logger.error('Account deletion failed', { error: error.message, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete account',
      },
    });
  }
};
