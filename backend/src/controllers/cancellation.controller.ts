import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import cancellationService from '../services/cancellation.service';
import logger from '../utils/logger';

export const cancelReservationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid reservation ID format'),
  }),
  body: z.object({
    reason: z.string().optional(),
    canceled_by: z.enum(['participant', 'yalla', 'host']).optional(),
  }).optional(),
});

export const cancelReservationHandler = async (req: AuthRequest, res: Response) => {
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

    const reservationId = req.params.id;
    const isStaff = ['staff', 'admin', 'operations', 'support'].includes(req.user.role);
    const requestedCanceledBy = req.body?.canceled_by;

    // Non-staff can only cancel as participant
    const canceledBy: 'participant' | 'yalla' | 'host' = isStaff
      ? (requestedCanceledBy || 'yalla')
      : 'participant';

    const reason = req.body?.reason;

    const result = await cancellationService.executeCancellation({
      reservationId,
      canceledBy,
      reason,
      actorId: req.user.userId,
      actorRole: req.user.role,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      data: result,
      message: 'Reservation cancelled successfully',
    });
  } catch (error: any) {
    if (error.message === 'RESERVATION_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: {
          code: 'RESERVATION_NOT_FOUND',
          message: 'Reservation not found',
        },
      });
    }

    if (error.message === 'FORBIDDEN') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to cancel this reservation',
        },
      });
    }

    if (error.message?.includes('INVALID_STATE_TRANSITION') || error.message?.includes('Invalid state transition')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANCELLATION_FAILED',
          message: error.message,
        },
      });
    }

    logger.error('Cancellation endpoint error', { error: error.message });
    return res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_RESERVATION_FAILED',
        message: 'Failed to cancel reservation',
      },
    });
  }
};
