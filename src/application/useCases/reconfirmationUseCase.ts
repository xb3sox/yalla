/**
 * Reconfirmation Use Case
 * 
 * Handles the business logic for reconfirming reservations.
 * Implements validation and state transitions.
 */

import type { Reservation } from '../../domain/entities';
import { isValidTransition } from '../../domain/services';

export interface ReconfirmationRequest {
  reservationId: string;
}

export interface ReconfirmationResult {
  success: boolean;
  updatedReservation?: Reservation;
  error?: string;
  errorAr?: string;
}

/**
 * Validate reconfirmation request
 */
export function validateReconfirmation(
  request: ReconfirmationRequest,
  reservations: Reservation[]
): ReconfirmationResult {
  const reservation = reservations.find(r => r.id === request.reservationId);

  if (!reservation) {
    return {
      success: false,
      error: 'Reservation not found',
      errorAr: 'الحجز غير موجود',
    };
  }

  // Check if reconfirmation is allowed
  if (reservation.state !== 'reconfirmation_required') {
    return {
      success: false,
      error: 'Reconfirmation is not required for this reservation',
      errorAr: 'إعادة التأكيد غير مطلوبة لهذا الحجز',
    };
  }

  // Check if expired
  if (reservation.expiryAt && new Date(reservation.expiryAt) < new Date()) {
    return {
      success: false,
      error: 'Reconfirmation period has expired',
      errorAr: 'انتهت فترة إعادة التأكيد',
    };
  }

  // Validate state transition
  if (!isValidTransition(reservation.state, 'reconfirmed')) {
    return {
      success: false,
      error: 'Invalid state transition',
      errorAr: 'انتقال حالة غير صالح',
    };
  }

  // Update reservation
  const updatedReservation: Reservation = {
    ...reservation,
    state: 'reconfirmed',
    reconfirmedAt: new Date().toISOString(),
  };

  return {
    success: true,
    updatedReservation,
  };
}

/**
 * Reconfirm reservation
 */
export function reconfirmReservation(
  request: ReconfirmationRequest,
  reservations: Reservation[]
): ReconfirmationResult {
  return validateReconfirmation(request, reservations);
}
