import { describe, it, expect } from 'vitest';
import { createBooking, validateBookingRequest } from './bookingUseCase';
import type { Experience, Reservation } from '../../types';

describe('bookingUseCase', () => {
  const mockExperience: Experience = {
    id: 'exp-1',
    title: 'Test Experience',
    titleAr: 'تجربة اختبارية',
    description: 'Test description',
    descriptionAr: 'وصف اختباري',
    timeline: [],
    date: '2026-02-15',
    time: '17:00',
    duration: '3 hours',
    durationMinutes: 180,
    area: 'Test Area',
    areaAr: 'منطقة اختبار',
    groupSizeMin: 4,
    groupSizeMax: 8,
    language: 'en',
    price: 175,
    currency: 'SAR',
    included: [],
    includedAr: [],
    excluded: [],
    excludedAr: [],
    accessibility: 'Test accessibility',
    accessibilityAr: 'اختبار إمكانية الوصول',
    physicalDemand: 'low',
    environment: 'Test environment',
    environmentAr: 'بيئة اختبار',
    noiseLevel: 'moderate',
    hostRole: 'Test host',
    hostRoleAr: 'مضيف اختبار',
    requirements: [],
    requirementsAr: [],
    cancellationSummary: 'Test cancellation',
    cancellationSummaryAr: 'إلغاء اختباري',
    imageUrl: 'test.jpg',
    planState: 'published',
    capacity: 8,
    booked: 5,
    primaryHostId: 'host-1',
    backupHostId: 'host-2',
    primaryVenueId: 'venue-1',
    fallbackVenueId: 'venue-2',
    minAttendance: 4,
  };

  const mockExperiences: Experience[] = [mockExperience];

  const mockReservation: Reservation = {
    id: 'res-1',
    participantId: 'user-1',
    planId: 'exp-1',
    state: 'confirmed',
    createdAt: '2026-01-20T14:00:00Z',
    paymentState: 'captured',
    idempotencyKey: 'idem-1',
  };

  describe('validateBookingRequest', () => {
    it('should reject booking if experience not found', () => {
      const request = {
        participantId: 'user-1',
        experienceId: 'non-existent',
        idempotencyKey: 'idem-1',
      };

      const result = validateBookingRequest(request, [], []);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Experience not found');
    });

    it('should reject booking if experience not published', () => {
      const unpublishedExperience = { ...mockExperience, planState: 'draft' as const };
      const request = {
        participantId: 'user-1',
        experienceId: 'exp-1',
        idempotencyKey: 'idem-1',
      };

      const result = validateBookingRequest(request, [unpublishedExperience], []);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('This experience is not available');
    });

    it('should reject booking if user has active reservation', () => {
      const request = {
        participantId: 'user-1',
        experienceId: 'exp-1',
        idempotencyKey: 'idem-1',
      };

      const result = validateBookingRequest(request, mockExperiences, [mockReservation]);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('You already have an active reservation for this experience');
    });

    it('should allow booking if no active reservation', () => {
      const request = {
        participantId: 'user-1',
        experienceId: 'exp-1',
        idempotencyKey: 'idem-1',
      };

      const result = validateBookingRequest(request, mockExperiences, []);
      
      expect(result.success).toBe(true);
      expect(result.reservation).toBeDefined();
      expect(result.reservation?.participantId).toBe('user-1');
      expect(result.reservation?.planId).toBe('exp-1');
    });

    it('should create waitlisted reservation if experience is full', () => {
      const fullExperience = { ...mockExperience, booked: 8 };
      const request = {
        participantId: 'user-1',
        experienceId: 'exp-1',
        idempotencyKey: 'idem-1',
      };

      const result = validateBookingRequest(request, [fullExperience], []);
      
      expect(result.success).toBe(true);
      expect(result.reservation?.state).toBe('waitlisted');
    });

    it('should create confirmed reservation if experience has capacity', () => {
      const request = {
        participantId: 'user-1',
        experienceId: 'exp-1',
        idempotencyKey: 'idem-1',
      };

      const result = validateBookingRequest(request, mockExperiences, []);
      
      expect(result.success).toBe(true);
      expect(result.reservation?.state).toBe('confirmed');
    });
  });

  describe('createBooking', () => {
    it('should create booking successfully', () => {
      const request = {
        participantId: 'user-1',
        experienceId: 'exp-1',
        idempotencyKey: 'idem-1',
      };

      const result = createBooking(request, mockExperiences, []);
      
      expect(result.success).toBe(true);
      expect(result.reservation).toBeDefined();
      expect(result.reservation?.id).toMatch(/^res-/);
      expect(result.reservation?.paymentId).toMatch(/^pay-synth-/);
      expect(result.reservation?.paymentState).toBe('captured');
    });

    it('should prevent duplicate bookings', () => {
      const request = {
        participantId: 'user-1',
        experienceId: 'exp-1',
        idempotencyKey: 'idem-1',
      };

      const result1 = createBooking(request, mockExperiences, []);
      expect(result1.success).toBe(true);

      const result2 = createBooking(request, mockExperiences, [result1.reservation!]);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('You already have an active reservation for this experience');
    });
  });
});
