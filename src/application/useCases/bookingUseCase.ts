/**
 * Booking Use Case
 * 
 * Handles the business logic for booking experiences.
 * Implements validation, state transitions, and error handling.
 */

import type { Experience, Reservation } from '../../domain/entities';
import { ReservationStateMachine, hasConfirmedPlace, isActiveReservation } from '../../domain/services';

export interface BookingRequest {
  participantId: string;
  experienceId: string;
  idempotencyKey: string;
}

export interface BookingResult {
  success: boolean;
  reservation?: Reservation;
  error?: string;
  errorAr?: string;
}

/**
 * Validate booking request
 */
export function validateBookingRequest(
  request: BookingRequest,
  experiences: Experience[],
  existingReservations: Reservation[]
): BookingResult {
  // Check if experience exists
  const experience = experiences.find(e => e.id === request.experienceId);
  if (!experience) {
    return {
      success: false,
      error: 'Experience not found',
      errorAr: 'التجربة غير موجودة',
    };
  }

  // Check if experience is available
  if (experience.planState !== 'published') {
    return {
      success: false,
      error: 'This experience is not available',
      errorAr: 'هذه التجربة غير متاحة',
    };
  }

  // Check for duplicate active reservation
  const hasActiveReservation = existingReservations.some(
    r => r.participantId === request.participantId &&
         r.planId === request.experienceId &&
         isActiveReservation(r.state)
  );

  if (hasActiveReservation) {
    return {
      success: false,
      error: 'You already have an active reservation for this experience',
      errorAr: 'لديك حجز نشط بالفعل لهذه التجربة',
    };
  }

  // Check capacity
  const isFull = experience.booked >= experience.capacity;

  // Create reservation
  const reservation: Reservation = {
    id: `res-${Date.now()}`,
    participantId: request.participantId,
    planId: request.experienceId,
    state: isFull ? 'waitlisted' : 'confirmed',
    createdAt: new Date().toISOString(),
    confirmedAt: isFull ? undefined : new Date().toISOString(),
    paymentState: 'captured',
    paymentId: `pay-synth-${Date.now()}`,
    idempotencyKey: request.idempotencyKey,
  };

  return {
    success: true,
    reservation,
  };
}

/**
 * Create booking
 */
export function createBooking(
  request: BookingRequest,
  experiences: Experience[],
  existingReservations: Reservation[]
): BookingResult {
  return validateBookingRequest(request, experiences, existingReservations);
}
