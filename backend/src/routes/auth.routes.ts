import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
  updatePreferences,
  exportData,
  deleteAccount,
  registerSchema,
  loginSchema,
  refreshSchema,
  updatePreferencesSchema,
} from '../controllers/auth.controller';
import { validateBody } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validateBody(registerSchema), register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validateBody(loginSchema), login);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user and clear auth cookies
 * @access  Public
 */
router.post('/logout', logout);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', validateBody(refreshSchema), refreshToken);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   PUT /api/v1/auth/preferences
 * @desc    Update user preferences
 * @access  Private
 */
router.put('/preferences', authenticate, validateBody(updatePreferencesSchema), updatePreferences);

/**
 * @route   GET /api/v1/auth/export
 * @desc    Export user data
 * @access  Private
 */
router.get('/export', authenticate, exportData);

/**
 * @route   DELETE /api/v1/auth/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', authenticate, deleteAccount);

export default router;
