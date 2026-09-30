/**
 * Reservation State Machine
 * 
 * Implements a finite state machine for managing reservation lifecycle.
 * Ensures valid state transitions and prevents invalid operations.
 * 
 * State Transitions:
 * initiated → payment_pending → confirmed → reconfirmation_required → reconfirmed → checked_in → attended → completed
 *                                                                                      ↓
 *                                                                                  no_show
 * 
 * Alternative paths:
 * - Any state → cancelled_by_participant
 * - Any state → cancelled_by_yalla
 * - payment_pending → failed
 * - confirmed → waitlisted (if capacity exceeded)
 */

import type { ReservationState } from '../entities';

// Valid state transitions map
const VALID_TRANSITIONS: Record<ReservationState, ReservationState[]> = {
  initiated: ['payment_pending', 'cancelled_by_participant', 'cancelled_by_yalla'],
  payment_pending: ['confirmed', 'cancelled_by_participant', 'cancelled_by_yalla'],
  confirmed: ['reconfirmation_required', 'checked_in', 'waitlisted', 'cancelled_by_participant', 'cancelled_by_yalla'],
  reconfirmation_required: ['reconfirmed', 'expired', 'cancelled_by_participant', 'cancelled_by_yalla'],
  reconfirmed: ['checked_in', 'cancelled_by_participant', 'cancelled_by_yalla'],
  checked_in: ['attended', 'no_show', 'cancelled_by_yalla'],
  attended: ['completed'],
  completed: [],
  waitlisted: ['offered', 'cancelled_by_participant', 'cancelled_by_yalla'],
  offered: ['confirmed', 'expired', 'cancelled_by_participant', 'cancelled_by_yalla'],
  expired: [],
  no_show: [],
  cancelled_by_participant: ['refund_pending'],
  cancelled_by_yalla: ['refund_pending'],
  refund_pending: ['refunded'],
  refunded: [],
};

// Terminal states (no further transitions allowed)
const TERMINAL_STATES: ReservationState[] = [
  'completed',
  'expired',
  'refunded',
  'no_show',
];

/**
 * Check if a state transition is valid
 */
export function isValidTransition(
  currentState: ReservationState,
  nextState: ReservationState
): boolean {
  const validNextStates = VALID_TRANSITIONS[currentState];
  return validNextStates.includes(nextState);
}

/**
 * Check if a state is terminal (no further transitions allowed)
 */
export function isTerminalState(state: ReservationState): boolean {
  return TERMINAL_STATES.includes(state);
}

/**
 * Get all valid next states from current state
 */
export function getValidNextStates(currentState: ReservationState): ReservationState[] {
  return VALID_TRANSITIONS[currentState] || [];
}

/**
 * Check if reservation can be cancelled
 */
export function canCancel(state: ReservationState): boolean {
  const cancellableStates: ReservationState[] = [
    'initiated',
    'payment_pending',
    'confirmed',
    'reconfirmation_required',
    'reconfirmed',
    'waitlisted',
    'offered',
  ];
  return cancellableStates.includes(state);
}

/**
 * Check if reservation requires reconfirmation
 */
export function requiresReconfirmation(state: ReservationState): boolean {
  return state === 'reconfirmation_required';
}

/**
 * Check if reservation is active (not cancelled, expired, or completed)
 */
export function isActiveReservation(state: ReservationState): boolean {
  const activeStates: ReservationState[] = [
    'initiated',
    'payment_pending',
    'confirmed',
    'reconfirmation_required',
    'reconfirmed',
    'checked_in',
    'attended',
    'waitlisted',
    'offered',
  ];
  return activeStates.includes(state);
}

/**
 * Check if user has a place (confirmed attendance)
 */
export function hasConfirmedPlace(state: ReservationState): boolean {
  const confirmedStates: ReservationState[] = [
    'confirmed',
    'reconfirmation_required',
    'reconfirmed',
    'checked_in',
    'attended',
  ];
  return confirmedStates.includes(state);
}

/**
 * Get human-readable state description
 */
export function getStateDescription(state: ReservationState, lang: 'en' | 'ar'): string {
  const descriptions: Record<ReservationState, { en: string; ar: string }> = {
    initiated: { en: 'Reservation initiated', ar: 'تم بدء الحجز' },
    payment_pending: { en: 'Payment pending', ar: 'الدفع قيد الانتظار' },
    confirmed: { en: 'Confirmed', ar: 'مؤكد' },
    reconfirmation_required: { en: 'Reconfirmation required', ar: 'إعادة التأكيد مطلوبة' },
    reconfirmed: { en: 'Reconfirmed', ar: 'تمت إعادة التأكيد' },
    checked_in: { en: 'Checked in', ar: 'تم تسجيل الوصول' },
    attended: { en: 'Attended', ar: 'تم الحضور' },
    completed: { en: 'Completed', ar: 'مكتمل' },
    waitlisted: { en: 'Waitlisted', ar: 'في قائمة الانتظار' },
    offered: { en: 'Seat offered', ar: 'تم عرض المقعد' },
    expired: { en: 'Expired', ar: 'منتهي الصلاحية' },
    no_show: { en: 'No show', ar: 'لم يحضر' },
    cancelled_by_participant: { en: 'Cancelled by participant', ar: 'ملغي من المشارك' },
    cancelled_by_yalla: { en: 'Cancelled by Yalla', ar: 'ملغي من يلا' },
    refund_pending: { en: 'Refund pending', ar: 'الاسترداد قيد الانتظار' },
    refunded: { en: 'Refunded', ar: 'تم الاسترداد' },
  };

  return descriptions[state][lang];
}

/**
 * Reservation State Machine Class
 * Provides a clean API for managing reservation state transitions
 */
export class ReservationStateMachine {
  private currentState: ReservationState;

  constructor(initialState: ReservationState = 'initiated') {
    this.currentState = initialState;
  }

  /**
   * Get current state
   */
  getState(): ReservationState {
    return this.currentState;
  }

  /**
   * Transition to a new state
   * @throws Error if transition is invalid
   */
  transition(newState: ReservationState): void {
    if (!isValidTransition(this.currentState, newState)) {
      throw new Error(
        `Invalid state transition: ${this.currentState} → ${newState}`
      );
    }
    this.currentState = newState;
  }

  /**
   * Try to transition, returns success status
   */
  tryTransition(newState: ReservationState): boolean {
    if (isValidTransition(this.currentState, newState)) {
      this.currentState = newState;
      return true;
    }
    return false;
  }

  /**
   * Check if can transition to a specific state
   */
  canTransitionTo(newState: ReservationState): boolean {
    return isValidTransition(this.currentState, newState);
  }

  /**
   * Get all valid next states
   */
  getValidNextStates(): ReservationState[] {
    return getValidNextStates(this.currentState);
  }

  /**
   * Check if in terminal state
   */
  isTerminal(): boolean {
    return isTerminalState(this.currentState);
  }

  /**
   * Check if can be cancelled
   */
  canCancel(): boolean {
    return canCancel(this.currentState);
  }

  /**
   * Check if requires reconfirmation
   */
  requiresReconfirmation(): boolean {
    return requiresReconfirmation(this.currentState);
  }

  /**
   * Check if active
   */
  isActive(): boolean {
    return isActiveReservation(this.currentState);
  }

  /**
   * Check if has confirmed place
   */
  hasConfirmedPlace(): boolean {
    return hasConfirmedPlace(this.currentState);
  }

  /**
   * Get state description
   */
  getDescription(lang: 'en' | 'ar'): string {
    return getStateDescription(this.currentState, lang);
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.currentState = 'initiated';
  }
}
