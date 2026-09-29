import { describe, it, expect } from 'vitest';
import {
  ReservationStateMachine,
  isValidTransition,
  isTerminalState,
  canCancel,
  requiresReconfirmation,
  isActiveReservation,
  hasConfirmedPlace,
  getStateDescription,
} from './ReservationStateMachine';

describe('ReservationStateMachine', () => {
  describe('isValidTransition', () => {
    it('should allow valid transitions', () => {
      expect(isValidTransition('initiated', 'payment_pending')).toBe(true);
      expect(isValidTransition('payment_pending', 'confirmed')).toBe(true);
      expect(isValidTransition('confirmed', 'reconfirmation_required')).toBe(true);
      expect(isValidTransition('reconfirmation_required', 'reconfirmed')).toBe(true);
      expect(isValidTransition('reconfirmed', 'checked_in')).toBe(true);
      expect(isValidTransition('checked_in', 'attended')).toBe(true);
      expect(isValidTransition('attended', 'completed')).toBe(true);
    });

    it('should reject invalid transitions', () => {
      expect(isValidTransition('initiated', 'confirmed')).toBe(false);
      expect(isValidTransition('completed', 'initiated')).toBe(false);
      expect(isValidTransition('expired', 'confirmed')).toBe(false);
      expect(isValidTransition('refunded', 'confirmed')).toBe(false);
    });

    it('should allow cancellation from valid states', () => {
      expect(isValidTransition('initiated', 'cancelled_by_participant')).toBe(true);
      expect(isValidTransition('payment_pending', 'cancelled_by_participant')).toBe(true);
      expect(isValidTransition('confirmed', 'cancelled_by_participant')).toBe(true);
      expect(isValidTransition('reconfirmation_required', 'cancelled_by_participant')).toBe(true);
    });

    it('should not allow cancellation from terminal states', () => {
      expect(isValidTransition('completed', 'cancelled_by_participant')).toBe(false);
      expect(isValidTransition('expired', 'cancelled_by_participant')).toBe(false);
      expect(isValidTransition('refunded', 'cancelled_by_participant')).toBe(false);
    });
  });

  describe('isTerminalState', () => {
    it('should identify terminal states', () => {
      expect(isTerminalState('completed')).toBe(true);
      expect(isTerminalState('expired')).toBe(true);
      expect(isTerminalState('refunded')).toBe(true);
      expect(isTerminalState('no_show')).toBe(true);
    });

    it('should identify non-terminal states', () => {
      expect(isTerminalState('initiated')).toBe(false);
      expect(isTerminalState('payment_pending')).toBe(false);
      expect(isTerminalState('confirmed')).toBe(false);
      expect(isTerminalState('reconfirmation_required')).toBe(false);
      expect(isTerminalState('reconfirmed')).toBe(false);
      expect(isTerminalState('checked_in')).toBe(false);
      expect(isTerminalState('attended')).toBe(false);
    });
  });

  describe('canCancel', () => {
    it('should allow cancellation from cancellable states', () => {
      expect(canCancel('initiated')).toBe(true);
      expect(canCancel('payment_pending')).toBe(true);
      expect(canCancel('confirmed')).toBe(true);
      expect(canCancel('reconfirmation_required')).toBe(true);
      expect(canCancel('reconfirmed')).toBe(true);
      expect(canCancel('waitlisted')).toBe(true);
      expect(canCancel('offered')).toBe(true);
    });

    it('should not allow cancellation from non-cancellable states', () => {
      expect(canCancel('completed')).toBe(false);
      expect(canCancel('attended')).toBe(false);
      expect(canCancel('checked_in')).toBe(false);
      expect(canCancel('expired')).toBe(false);
      expect(canCancel('no_show')).toBe(false);
      expect(canCancel('cancelled_by_participant')).toBe(false);
      expect(canCancel('cancelled_by_yalla')).toBe(false);
      expect(canCancel('refund_pending')).toBe(false);
      expect(canCancel('refunded')).toBe(false);
    });
  });

  describe('requiresReconfirmation', () => {
    it('should require reconfirmation only for reconfirmation_required state', () => {
      expect(requiresReconfirmation('reconfirmation_required')).toBe(true);
      expect(requiresReconfirmation('confirmed')).toBe(false);
      expect(requiresReconfirmation('reconfirmed')).toBe(false);
      expect(requiresReconfirmation('initiated')).toBe(false);
    });
  });

  describe('isActiveReservation', () => {
    it('should identify active reservations', () => {
      expect(isActiveReservation('initiated')).toBe(true);
      expect(isActiveReservation('payment_pending')).toBe(true);
      expect(isActiveReservation('confirmed')).toBe(true);
      expect(isActiveReservation('reconfirmation_required')).toBe(true);
      expect(isActiveReservation('reconfirmed')).toBe(true);
      expect(isActiveReservation('checked_in')).toBe(true);
      expect(isActiveReservation('attended')).toBe(true);
      expect(isActiveReservation('waitlisted')).toBe(true);
      expect(isActiveReservation('offered')).toBe(true);
    });

    it('should identify inactive reservations', () => {
      expect(isActiveReservation('completed')).toBe(false);
      expect(isActiveReservation('expired')).toBe(false);
      expect(isActiveReservation('no_show')).toBe(false);
      expect(isActiveReservation('cancelled_by_participant')).toBe(false);
      expect(isActiveReservation('cancelled_by_yalla')).toBe(false);
      expect(isActiveReservation('refund_pending')).toBe(false);
      expect(isActiveReservation('refunded')).toBe(false);
    });
  });

  describe('hasConfirmedPlace', () => {
    it('should identify confirmed places', () => {
      expect(hasConfirmedPlace('confirmed')).toBe(true);
      expect(hasConfirmedPlace('reconfirmation_required')).toBe(true);
      expect(hasConfirmedPlace('reconfirmed')).toBe(true);
      expect(hasConfirmedPlace('checked_in')).toBe(true);
      expect(hasConfirmedPlace('attended')).toBe(true);
    });

    it('should identify non-confirmed places', () => {
      expect(hasConfirmedPlace('initiated')).toBe(false);
      expect(hasConfirmedPlace('payment_pending')).toBe(false);
      expect(hasConfirmedPlace('waitlisted')).toBe(false);
      expect(hasConfirmedPlace('offered')).toBe(false);
      expect(hasConfirmedPlace('completed')).toBe(false);
      expect(hasConfirmedPlace('cancelled_by_participant')).toBe(false);
    });
  });

  describe('getStateDescription', () => {
    it('should return English descriptions', () => {
      expect(getStateDescription('initiated', 'en')).toBe('Reservation initiated');
      expect(getStateDescription('confirmed', 'en')).toBe('Confirmed');
      expect(getStateDescription('completed', 'en')).toBe('Completed');
    });

    it('should return Arabic descriptions', () => {
      expect(getStateDescription('initiated', 'ar')).toBe('تم بدء الحجز');
      expect(getStateDescription('confirmed', 'ar')).toBe('مؤكد');
      expect(getStateDescription('completed', 'ar')).toBe('مكتمل');
    });
  });

  describe('ReservationStateMachine class', () => {
    it('should initialize with default state', () => {
      const sm = new ReservationStateMachine();
      expect(sm.getState()).toBe('initiated');
    });

    it('should initialize with custom state', () => {
      const sm = new ReservationStateMachine('confirmed');
      expect(sm.getState()).toBe('confirmed');
    });

    it('should transition to valid states', () => {
      const sm = new ReservationStateMachine('initiated');
      sm.transition('payment_pending');
      expect(sm.getState()).toBe('payment_pending');
      
      sm.transition('confirmed');
      expect(sm.getState()).toBe('confirmed');
    });

    it('should throw error on invalid transition', () => {
      const sm = new ReservationStateMachine('initiated');
      expect(() => sm.transition('confirmed')).toThrow('Invalid state transition');
    });

    it('should try transition without throwing', () => {
      const sm = new ReservationStateMachine('initiated');
      
      const success = sm.tryTransition('confirmed');
      expect(success).toBe(false);
      expect(sm.getState()).toBe('initiated');
      
      const validSuccess = sm.tryTransition('payment_pending');
      expect(validSuccess).toBe(true);
      expect(sm.getState()).toBe('payment_pending');
    });

    it('should check if can transition', () => {
      const sm = new ReservationStateMachine('initiated');
      expect(sm.canTransitionTo('payment_pending')).toBe(true);
      expect(sm.canTransitionTo('confirmed')).toBe(false);
    });

    it('should get valid next states', () => {
      const sm = new ReservationStateMachine('initiated');
      const nextStates = sm.getValidNextStates();
      expect(nextStates).toContain('payment_pending');
      expect(nextStates).toContain('cancelled_by_participant');
      expect(nextStates).toContain('cancelled_by_yalla');
    });

    it('should check if terminal', () => {
      const sm = new ReservationStateMachine('completed');
      expect(sm.isTerminal()).toBe(true);
      
      const sm2 = new ReservationStateMachine('confirmed');
      expect(sm2.isTerminal()).toBe(false);
    });

    it('should check if can cancel', () => {
      const sm = new ReservationStateMachine('confirmed');
      expect(sm.canCancel()).toBe(true);
      
      const sm2 = new ReservationStateMachine('completed');
      expect(sm2.canCancel()).toBe(false);
    });

    it('should check if requires reconfirmation', () => {
      const sm = new ReservationStateMachine('reconfirmation_required');
      expect(sm.requiresReconfirmation()).toBe(true);
      
      const sm2 = new ReservationStateMachine('confirmed');
      expect(sm2.requiresReconfirmation()).toBe(false);
    });

    it('should check if active', () => {
      const sm = new ReservationStateMachine('confirmed');
      expect(sm.isActive()).toBe(true);
      
      const sm2 = new ReservationStateMachine('completed');
      expect(sm2.isActive()).toBe(false);
    });

    it('should check if has confirmed place', () => {
      const sm = new ReservationStateMachine('confirmed');
      expect(sm.hasConfirmedPlace()).toBe(true);
      
      const sm2 = new ReservationStateMachine('waitlisted');
      expect(sm2.hasConfirmedPlace()).toBe(false);
    });

    it('should get description', () => {
      const sm = new ReservationStateMachine('confirmed');
      expect(sm.getDescription('en')).toBe('Confirmed');
      expect(sm.getDescription('ar')).toBe('مؤكد');
    });

    it('should reset to initial state', () => {
      const sm = new ReservationStateMachine('confirmed');
      sm.reset();
      expect(sm.getState()).toBe('initiated');
    });
  });
});
