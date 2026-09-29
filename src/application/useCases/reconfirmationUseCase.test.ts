import { describe, it, expect } from 'vitest';
import { reconfirmReservation, validateReconfirmation } from './reconfirmationUseCase';
import type { Reservation } from '../../types';

describe('reconfirmationUseCase', () => {
  const mockReservation: Reservation = {
    id: 'res-1',
    participantId: 'user-1',
    planId: 'exp-1',
    state: 'reconfirmation_required',
    createdAt: '2026-01-20T14:00:00Z',
    confirmedAt: '2026-01-20T14:01:00Z',
    expiryAt: '2026-12-31T23:59:59Z',
    paymentState: 'captured',
    idempotencyKey: 'idem-1',
  };

  const mockReservations: Reservation[] = [mockReservation];

  describe('validateReconfirmation', () => {
    it('should reject if reservation not found', () => {
      const request = { reservationId: 'non-existent' };
      const result = validateReconfirmation(request, []);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Reservation not found');
    });

    it('should reject if state is not reconfirmation_required', () => {
      const confirmedReservation = { ...mockReservation, state: 'confirmed' as const };
      const request = { reservationId: 'res-1' };
      const result = validateReconfirmation(request, [confirmedReservation]);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Reconfirmation is not required for this reservation');
    });

    it('should reject if expired', () => {
      const expiredReservation = { 
        ...mockReservation, 
        expiryAt: '2020-01-01T00:00:00Z' 
      };
      const request = { reservationId: 'res-1' };
      const result = validateReconfirmation(request, [expiredReservation]);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Reconfirmation period has expired');
    });

    it('should allow valid reconfirmation', () => {
      const request = { reservationId: 'res-1' };
      const result = validateReconfirmation(request, mockReservations);
      
      expect(result.success).toBe(true);
      expect(result.updatedReservation).toBeDefined();
      expect(result.updatedReservation?.state).toBe('reconfirmed');
      expect(result.updatedReservation?.reconfirmedAt).toBeDefined();
    });

    it('should allow reconfirmation without expiry date', () => {
      const reservationWithoutExpiry = { ...mockReservation, expiryAt: undefined };
      const request = { reservationId: 'res-1' };
      const result = validateReconfirmation(request, [reservationWithoutExpiry]);
      
      expect(result.success).toBe(true);
    });
  });

  describe('reconfirmReservation', () => {
    it('should reconfirm reservation successfully', () => {
      const request = { reservationId: 'res-1' };
      const result = reconfirmReservation(request, mockReservations);
      
      expect(result.success).toBe(true);
      expect(result.updatedReservation?.state).toBe('reconfirmed');
      expect(result.updatedReservation?.reconfirmedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should preserve other reservation fields', () => {
      const request = { reservationId: 'res-1' };
      const result = reconfirmReservation(request, mockReservations);
      
      expect(result.updatedReservation?.id).toBe('res-1');
      expect(result.updatedReservation?.participantId).toBe('user-1');
      expect(result.updatedReservation?.planId).toBe('exp-1');
      expect(result.updatedReservation?.paymentState).toBe('captured');
    });
  });
});
