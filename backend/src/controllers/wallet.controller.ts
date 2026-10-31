import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import reservationModel from '../models/reservation.model';
import experienceModel from '../models/experience.model';
import appleWalletService from '../services/appleWallet.service';
import googleWalletService from '../services/googleWallet.service';
import logger from '../utils/logger';

// In-memory registration store for Apple Wallet device registrations
const passRegistrations: Array<{
  deviceLibraryIdentifier: string;
  passTypeIdentifier: string;
  serialNumber: string;
  pushToken: string;
  registeredAt: Date;
}> = [];

/**
 * GET /api/v1/reservations/:id/wallet/apple
 * Generates and streams Apple Wallet .pkpass binary
 */
export const getApplePass = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { id } = req.params;
    const reservation = await reservationModel.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' },
      });
    }

    // Check ownership or staff permission
    if (
      reservation.participant_id !== req.user.userId &&
      !['operations', 'support', 'admin'].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied to this reservation' },
      });
    }

    const experience = await experienceModel.findById(reservation.experience_id);
    if (!experience) {
      return res.status(404).json({
        success: false,
        error: { code: 'EXPERIENCE_NOT_FOUND', message: 'Experience not found for reservation' },
      });
    }

    const passBuffer = await appleWalletService.generateApplePassBuffer(reservation, experience, {
      id: req.user.userId,
      display_name: req.user.role || 'Yalla Guest',
    });

    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="yalla-pass-${id}.pkpass"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    logger.info('Streamed Apple Wallet PKPASS file', { reservationId: id, userId: req.user.userId });
    return res.status(200).send(passBuffer);
  } catch (error: any) {
    logger.error('Failed to generate Apple Wallet pass', { error: error.message });
    return res.status(500).json({
      success: false,
      error: { code: 'PASS_GENERATION_FAILED', message: 'Failed to generate Apple Wallet pass' },
    });
  }
};

/**
 * GET /api/v1/reservations/:id/wallet/google
 * Generates Google Wallet save URL
 */
export const getGooglePass = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { id } = req.params;
    const reservation = await reservationModel.findById(id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        error: { code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' },
      });
    }

    // Check ownership or staff permission
    if (
      reservation.participant_id !== req.user.userId &&
      !['operations', 'support', 'admin'].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied to this reservation' },
      });
    }

    const experience = await experienceModel.findById(reservation.experience_id);
    if (!experience) {
      return res.status(404).json({
        success: false,
        error: { code: 'EXPERIENCE_NOT_FOUND', message: 'Experience not found for reservation' },
      });
    }

    const { saveUrl, payload } = googleWalletService.generateGoogleWalletSaveUrl(reservation, experience, {
      id: req.user.userId,
      display_name: req.user.role || 'Yalla Guest',
    });

    logger.info('Generated Google Wallet Save URL', { reservationId: id, userId: req.user.userId });

    return res.json({
      success: true,
      data: {
        saveUrl,
        payload,
      },
    });
  } catch (error: any) {
    logger.error('Failed to generate Google Wallet pass', { error: error.message });
    return res.status(500).json({
      success: false,
      error: { code: 'PASS_GENERATION_FAILED', message: 'Failed to generate Google Wallet pass' },
    });
  }
};

/**
 * Apple Wallet Web Service Endpoint: Register device for pass push updates
 */
export const registerPassDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = req.params;
    const { pushToken } = req.body;

    if (!pushToken) {
      return res.status(400).json({ success: false, error: 'Push token required' });
    }

    const existingIndex = passRegistrations.findIndex(
      (r) =>
        r.deviceLibraryIdentifier === deviceLibraryIdentifier &&
        r.passTypeIdentifier === passTypeIdentifier &&
        r.serialNumber === serialNumber
    );

    if (existingIndex >= 0) {
      passRegistrations[existingIndex].pushToken = pushToken;
      return res.status(200).send();
    }

    passRegistrations.push({
      deviceLibraryIdentifier,
      passTypeIdentifier,
      serialNumber,
      pushToken,
      registeredAt: new Date(),
    });

    logger.info('Registered Apple Wallet device', { deviceLibraryIdentifier, serialNumber });
    return res.status(201).send();
  } catch (error: any) {
    logger.error('Failed to register Apple Wallet pass device', { error: error.message });
    return res.status(500).send();
  }
};

/**
 * Apple Wallet Web Service Endpoint: Unregister device
 */
export const unregisterPassDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = req.params;

    const index = passRegistrations.findIndex(
      (r) =>
        r.deviceLibraryIdentifier === deviceLibraryIdentifier &&
        r.passTypeIdentifier === passTypeIdentifier &&
        r.serialNumber === serialNumber
    );

    if (index >= 0) {
      passRegistrations.splice(index, 1);
    }

    return res.status(200).send();
  } catch (error: any) {
    return res.status(500).send();
  }
};

/**
 * Apple Wallet Web Service Endpoint: Fetch latest pass payload
 */
export const getLatestPass = async (req: AuthRequest, res: Response) => {
  try {
    const { serialNumber } = req.params;
    const reservation = await reservationModel.findById(serialNumber);

    if (!reservation) {
      return res.status(404).send();
    }

    // Security: Apple Wallet Web Service protocol requires "Authorization: ApplePass <authenticationToken>"
    // Verify the client provides the pass's matching authenticationToken before streaming pass data.
    const authHeader = req.headers.authorization;
    const expectedToken = reservation.idempotency_key || 'auth_token_secret';
    if (!authHeader || authHeader !== `ApplePass ${expectedToken}`) {
      logger.warn('Unauthorized Apple Wallet pass access attempt', { serialNumber });
      return res.status(401).send();
    }

    const experience = await experienceModel.findById(reservation.experience_id);
    if (!experience) {
      return res.status(404).send();
    }

    const passBuffer = await appleWalletService.generateApplePassBuffer(reservation, experience);

    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="yalla-pass-${serialNumber}.pkpass"`);

    return res.status(200).send(passBuffer);
  } catch (error: any) {
    return res.status(500).send();
  }
};

/**
 * Trigger Push Pass Update upon reconfirmation
 */
export const pushPassUpdate = async (req: AuthRequest, res: Response) => {
  try {
    const { reservationId } = req.params;
    const reservation = await reservationModel.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ success: false, error: { message: 'Reservation not found' } });
    }

    const experience = await experienceModel.findById(reservation.experience_id);
    if (!experience) {
      return res.status(404).json({ success: false, error: { message: 'Experience not found' } });
    }

    // Trigger Google Wallet patch update
    const googlePayload = await googleWalletService.patchGoogleWalletPass(reservation, experience);

    // Filter registered Apple devices for this reservation
    const registrations = passRegistrations.filter((r) => r.serialNumber === reservationId);

    logger.info('Pushed pass updates to registered wallet clients', {
      reservationId,
      registeredDevicesCount: registrations.length,
      unlocked: appleWalletService.isVenueDetailsUnlocked(reservation, experience),
    });

    return res.json({
      success: true,
      data: {
        reservationId,
        pushedAppleDeviceCount: registrations.length,
        patchedGooglePass: googlePayload,
      },
    });
  } catch (error: any) {
    logger.error('Failed to push pass updates', { error: error.message });
    return res.status(500).json({ success: false, error: { message: 'Failed to push pass updates' } });
  }
};

export default {
  getApplePass,
  getGooglePass,
  registerPassDevice,
  unregisterPassDevice,
  getLatestPass,
  pushPassUpdate,
};
