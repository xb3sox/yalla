import { Router } from 'express';
import {
  getApplePass,
  getGooglePass,
  registerPassDevice,
  unregisterPassDevice,
  getLatestPass,
  pushPassUpdate,
} from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/reservations/:id/wallet/apple
 * @desc    Generate and stream Apple Wallet .pkpass binary
 * @access  Private
 */
router.get('/reservations/:id/wallet/apple', authenticate, getApplePass);

/**
 * @route   GET /api/v1/reservations/:id/wallet/google
 * @desc    Generate Google Wallet save URL
 * @access  Private
 */
router.get('/reservations/:id/wallet/google', authenticate, getGooglePass);

/**
 * Apple Wallet Web Service registration endpoints
 */
router.post(
  '/wallet/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
  registerPassDevice
);

router.delete(
  '/wallet/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
  unregisterPassDevice
);

router.get(
  '/wallet/v1/passes/:passTypeIdentifier/:serialNumber',
  getLatestPass
);

/**
 * @route   POST /api/v1/wallet/v1/push/:reservationId
 * @desc    Trigger pass push update upon attendance reconfirmation
 * @access  Private
 */
router.post('/wallet/v1/push/:reservationId', authenticate, pushPassUpdate);

export default router;
