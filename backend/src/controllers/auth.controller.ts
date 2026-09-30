import { Request, Response } from 'express';
import { z } from 'zod';
import userModel, { CreateUserInput, LoginInput } from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';
import logger from '../utils/logger';

// Validation schemas
export const registerSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
    display_name: z.string().min(2).max(100),
    password: z.string().min(8).max(100),
    language: z.string().optional().default('en'),
    preferred_area: z.string().optional(),
    experience_language: z.string().optional().default('en'),
    budget_min: z.number().int().min(0).optional().default(100),
    budget_max: z.number().int().min(0).optional().default(400),
    accessibility_needs: z.string().optional(),
    adult_declaration_accepted: z.boolean().refine((val) => val === true, {
      message: 'Adult declaration must be accepted',
    }),
    terms_accepted: z.boolean().refine((val) => val === true, {
      message: 'Terms must be accepted',
    }),
    marketing_consent: z.boolean().optional().default(false),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const updatePreferencesSchema = z.object({
  body: z.object({
    language: z.string().optional(),
    preferred_area: z.string().optional(),
    experience_language: z.string().optional(),
    budget_min: z.number().int().min(0).optional(),
    budget_max: z.number().int().min(0).optional(),
    accessibility_needs: z.string().optional(),
  }),
});

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response) => {
  try {
    const input: CreateUserInput = req.body;
    
    // Check if user already exists
    const existingUser = await userModel.findByPhone(input.phone);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this phone number already exists',
        },
      });
    }
    
    // Create user
    const user = await userModel.create(input);
    
    // Generate tokens
    const tokens = userModel.generateTokens(user);
    
    logger.info('User registered', { userId: user.id, phone: user.phone });
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          display_name: user.display_name,
          language: user.language,
          role: user.role,
        },
        tokens,
      },
    });
  } catch (error: any) {
    logger.error('Registration failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Failed to register user',
      },
    });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response) => {
  try {
    const input: LoginInput = req.body;
    
    const { user, tokens } = await userModel.login(input);
    
    logger.info('User logged in', { userId: user.id });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          display_name: user.display_name,
          language: user.language,
          role: user.role,
        },
        tokens,
      },
    });
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid phone or password',
        },
      });
    }
    
    logger.error('Login failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: 'Failed to login',
      },
    });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    const tokens = await userModel.refreshAccessToken(refreshToken);
    
    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      },
    });
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
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
    
    const user = await userModel.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          display_name: user.display_name,
          language: user.language,
          preferred_area: user.preferred_area,
          experience_language: user.experience_language,
          budget_min: user.budget_min,
          budget_max: user.budget_max,
          accessibility_needs: user.accessibility_needs,
          role: user.role,
          created_at: user.created_at,
        },
      },
    });
  } catch (error: any) {
    logger.error('Get current user failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USER_FAILED',
        message: 'Failed to get user',
      },
    });
  }
};

/**
 * Update user preferences
 */
export const updatePreferences = async (req: AuthRequest, res: Response) => {
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
    
    const preferences = req.body;
    const user = await userModel.updatePreferences(req.user.userId, preferences);
    
    logger.info('User preferences updated', { userId: user.id });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          display_name: user.display_name,
          language: user.language,
          preferred_area: user.preferred_area,
          experience_language: user.experience_language,
          budget_min: user.budget_min,
          budget_max: user.budget_max,
          accessibility_needs: user.accessibility_needs,
        },
      },
      message: 'Preferences updated successfully',
    });
  } catch (error: any) {
    logger.error('Update preferences failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PREFERENCES_FAILED',
        message: 'Failed to update preferences',
      },
    });
  }
};

/**
 * Export user data
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
    
    const data = await userModel.exportData(req.user.userId);
    
    logger.info('User data exported', { userId: req.user.userId });
    
    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error('Export data failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_FAILED',
        message: 'Failed to export data',
      },
    });
  }
};

/**
 * Delete user account
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
    
    await userModel.delete(req.user.userId);
    
    logger.info('User account deleted', { userId: req.user.userId });
    
    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete account failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete account',
      },
    });
  }
};
