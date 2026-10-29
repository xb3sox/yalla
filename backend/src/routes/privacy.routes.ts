import { Router } from 'express';
import { exportData, deleteAccount, deleteAccountSchema } from '../controllers/privacy.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';

const router = Router();

/**
 * @route   GET /api/v1/user/export-data
 * @desc    Export machine-readable user personal data archive
 * @access  Private
 */
router.get('/export-data', authenticate, exportData);

/**
 * @route   POST /api/v1/user/delete-account
 * @desc    Request account erasure and anonymization
 * @access  Private
 */
router.post('/delete-account', authenticate, validateBody(deleteAccountSchema), deleteAccount);

export default router;
