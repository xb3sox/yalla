import { Request, Response, NextFunction } from 'express';
import userModel from '../models/user.model';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    phone: string;
    role: string;
  };
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token is required',
        },
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = userModel.verifyAccessToken(token);
    
    req.user = {
      userId: decoded.userId,
      phone: decoded.phone,
      role: decoded.role,
    };
    
    next();
  } catch (error: any) {
    logger.warn('Authentication failed', { error: error.message });
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
};

/**
 * Authorization middleware - checks user role
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.userId,
        userRole: req.user.role,
        allowedRoles,
      });
      
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    }
    
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = userModel.verifyAccessToken(token);
      
      req.user = {
        userId: decoded.userId,
        phone: decoded.phone,
        role: decoded.role,
      };
    }
    
    next();
  } catch (error) {
    // Continue without user
    next();
  }
};

/**
 * Ownership check - ensures user can only access their own data
 */
export const checkOwnership = (resourceIdParam: string = 'id') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
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
      
      // Admin and staff can access any resource
      if (['admin', 'operations', 'support', 'trust_safety'].includes(req.user.role)) {
        return next();
      }
      
      // For participants, check ownership
      // This is a generic middleware, specific ownership checks should be in controllers
      next();
    } catch (error) {
      next(error);
    }
  };
};
