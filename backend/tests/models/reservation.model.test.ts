import reservationModel, { stateMachine } from '../../src/models/reservation.model';
import experienceModel from '../../src/models/experience.model';
import userModel from '../../src/models/user.model';
import pool from '../../src/config/database';

describe('Reservation Model', () => {
  let testUserId: string;
  let testExperienceId: string;
  let testReservationId: string;

  beforeAll(async () => {
    // Create test user
    const user = await userModel.create({
      phone: '+966509999999',
      password: 'password123',
      display_name: 'Test User',
      language: 'en',
      adult_declaration_accepted: true,
      terms_accepted: true,
    });
    testUserId = user.id;

    // Create test experience
    const experience = await experienceModel.create({
      title: 'Test Experience',
      title_ar: 'تجربة اختبارية',
      description: 'Test description',
      description_ar: 'وصف اختباري',
      date: '2027-03-01',
      time: '10:00',
      duration: '2 hours',
      duration_minutes: 120,
      area: 'Riyadh',
      area_ar: 'الرياض',
      group_size_min: 4,
      group_size_max: 8,
      language: 'en',
      price: 100,
      capacity: 8,
      plan_state: 'published',
    });
    testExperienceId = experience.id;
  });

  // The model allows only one ACTIVE reservation per participant+experience,
  // so each test must start without leftovers from the previous one. Every
  // suite below creates the reservation it needs.
  beforeEach(async () => {
    await pool.query('DELETE FROM reservations WHERE participant_id = $1', [testUserId]);
  });

  // No per-file cleanup: tests/setup.ts wipes all tables before each file.

  describe('State Machine', () => {
    it('should allow valid state transitions', () => {
      expect(stateMachine.canTransition('initiated', 'payment_pending')).toBe(true);
      expect(stateMachine.canTransition('payment_pending', 'confirmed')).toBe(true);
      expect(stateMachine.canTransition('confirmed', 'reconfirmation_required')).toBe(true);
      expect(stateMachine.canTransition('reconfirmation_required', 'reconfirmed')).toBe(true);
      expect(stateMachine.canTransition('reconfirmed', 'checked_in')).toBe(true);
      expect(stateMachine.canTransition('checked_in', 'attended')).toBe(true);
      expect(stateMachine.canTransition('attended', 'completed')).toBe(true);
    });

    it('should reject invalid state transitions', () => {
      expect(stateMachine.canTransition('initiated', 'confirmed')).toBe(false);
      expect(stateMachine.canTransition('completed', 'initiated')).toBe(false);
      expect(stateMachine.canTransition('cancelled_by_participant', 'confirmed')).toBe(false);
    });

    it('should allow cancellation from valid states', () => {
      expect(stateMachine.canTransition('initiated', 'cancelled_by_participant')).toBe(true);
      expect(stateMachine.canTransition('payment_pending', 'cancelled_by_participant')).toBe(true);
      expect(stateMachine.canTransition('confirmed', 'cancelled_by_participant')).toBe(true);
      expect(stateMachine.canTransition('reconfirmation_required', 'cancelled_by_participant')).toBe(true);
      expect(stateMachine.canTransition('waitlisted', 'cancelled_by_participant')).toBe(true);
    });

    it('should not allow cancellation from terminal states', () => {
      expect(stateMachine.canTransition('completed', 'cancelled_by_participant')).toBe(false);
      expect(stateMachine.canTransition('expired', 'cancelled_by_participant')).toBe(false);
      expect(stateMachine.canTransition('refunded', 'cancelled_by_participant')).toBe(false);
    });

    it('should return valid next states', () => {
      const nextStates = stateMachine.getNextStates('initiated');
      expect(nextStates).toContain('payment_pending');
      expect(nextStates).toContain('cancelled_by_participant');
      expect(nextStates).toContain('cancelled_by_yalla');
    });
  });

  describe('create', () => {
    it('should create a new reservation', async () => {
      const reservation = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-1',
      });

      expect(reservation).toBeDefined();
      expect(reservation.id).toBeDefined();
      expect(reservation.participant_id).toBe(testUserId);
      expect(reservation.experience_id).toBe(testExperienceId);
      expect(reservation.state).toBe('initiated');
      expect(reservation.payment_state).toBe('initiated');
      expect(reservation.idempotency_key).toBe('test-key-1');

      testReservationId = reservation.id;
    });

    it('should return existing reservation for duplicate idempotency key', async () => {
      const reservation1 = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'duplicate-key',
      });

      const reservation2 = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'duplicate-key',
      });

      expect(reservation1.id).toBe(reservation2.id);
    });

    it('should prevent duplicate active reservations', async () => {
      await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-2',
      });

      await expect(
        reservationModel.create({
          participant_id: testUserId,
          experience_id: testExperienceId,
          idempotency_key: 'test-key-3',
        })
      ).rejects.toThrow('Active reservation already exists');
    });
  });

  describe('findById', () => {
    it('should find reservation by ID', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-find',
      });

      const reservation = await reservationModel.findById(created.id);

      expect(reservation).toBeDefined();
      expect(reservation?.id).toBe(created.id);
      expect(reservation?.participant_id).toBe(testUserId);
    });

    it('should return null for non-existent ID', async () => {
      const reservation = await reservationModel.findById(
        '00000000-0000-0000-0000-000000000000'
      );
      expect(reservation).toBeNull();
    });
  });

  describe('findByParticipant', () => {
    it('should find all reservations for a participant', async () => {
      await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'find-by-participant',
      } as any);

      const reservations = await reservationModel.findByParticipant(testUserId);

      expect(reservations).toBeDefined();
      expect(Array.isArray(reservations)).toBe(true);
      expect(reservations.length).toBeGreaterThan(0);
      expect(reservations.every((r) => r.participant_id === testUserId)).toBe(true);
    });
  });

  describe('findByExperience', () => {
    it('should find all reservations for an experience', async () => {
      await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'find-by-experience',
      } as any);

      const reservations = await reservationModel.findByExperience(testExperienceId);

      expect(reservations).toBeDefined();
      expect(Array.isArray(reservations)).toBe(true);
      expect(reservations.length).toBeGreaterThan(0);
      expect(reservations.every((r) => r.experience_id === testExperienceId)).toBe(true);
    });
  });

  describe('updateState', () => {
    it('should update reservation state', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-update',
      });

      const updated = await reservationModel.updateState(created.id, 'payment_pending');

      expect(updated.state).toBe('payment_pending');
    });

    it('should reject invalid state transitions', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-invalid',
      });

      await expect(
        reservationModel.updateState(created.id, 'completed')
      ).rejects.toThrow('Invalid state transition');
    });

    it('should set confirmed_at when transitioning to confirmed', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-confirmed',
      });

      await reservationModel.updateState(created.id, 'payment_pending');
      const confirmed = await reservationModel.updateState(created.id, 'confirmed');

      expect(confirmed.state).toBe('confirmed');
      expect(confirmed.confirmed_at).toBeDefined();
    });

    it('should set reconfirmed_at when transitioning to reconfirmed', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-reconfirmed',
      });

      await reservationModel.updateState(created.id, 'payment_pending');
      await reservationModel.updateState(created.id, 'confirmed');
      await reservationModel.updateState(created.id, 'reconfirmation_required');
      const reconfirmed = await reservationModel.updateState(created.id, 'reconfirmed');

      expect(reconfirmed.state).toBe('reconfirmed');
      expect(reconfirmed.reconfirmed_at).toBeDefined();
    });

    it('should set checked_in_at when transitioning to checked_in', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-checked-in',
      });

      await reservationModel.updateState(created.id, 'payment_pending');
      await reservationModel.updateState(created.id, 'confirmed');
      await reservationModel.updateState(created.id, 'reconfirmation_required');
      await reservationModel.updateState(created.id, 'reconfirmed');
      const checkedIn = await reservationModel.updateState(created.id, 'checked_in');

      expect(checkedIn.state).toBe('checked_in');
      expect(checkedIn.checked_in_at).toBeDefined();
    });

    it('should set cancelled_at when cancelling', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-cancel',
      });

      const cancelled = await reservationModel.updateState(
        created.id,
        'cancelled_by_participant'
      );

      expect(cancelled.state).toBe('cancelled_by_participant');
      expect(cancelled.cancelled_at).toBeDefined();
    });
  });

  describe('reconfirm', () => {
    it('should reconfirm reservation', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-reconfirm',
      });

      await reservationModel.updateState(created.id, 'payment_pending');
      await reservationModel.updateState(created.id, 'confirmed');
      await reservationModel.updateState(created.id, 'reconfirmation_required');

      const reconfirmed = await reservationModel.reconfirm(created.id);

      expect(reconfirmed.state).toBe('reconfirmed');
      expect(reconfirmed.reconfirmed_at).toBeDefined();
    });

    it('should reject reconfirmation if not in reconfirmation_required state', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-reconfirm-invalid',
      });

      await expect(reservationModel.reconfirm(created.id)).rejects.toThrow(
        'Reservation is not in reconfirmation_required state'
      );
    });

    it('should reject reconfirmation if expired', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-reconfirm-expired',
      });

      await reservationModel.updateState(created.id, 'payment_pending');
      await reservationModel.updateState(created.id, 'confirmed');
      await reservationModel.updateState(created.id, 'reconfirmation_required');

      // Set expiry to past
      await pool.query(
        'UPDATE reservations SET expiry_at = CURRENT_TIMESTAMP - INTERVAL \'1 day\' WHERE id = $1',
        [created.id]
      );

      await expect(reservationModel.reconfirm(created.id)).rejects.toThrow(
        'Reconfirmation period has expired'
      );
    });
  });

  describe('cancel', () => {
    it('should cancel reservation by participant', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-cancel-participant',
      });

      const cancelled = await reservationModel.cancel(created.id, 'participant');

      expect(cancelled.state).toBe('cancelled_by_participant');
      expect(cancelled.cancelled_at).toBeDefined();
    });

    it('should cancel reservation by yalla', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-cancel-yalla',
      });

      const cancelled = await reservationModel.cancel(created.id, 'yalla');

      expect(cancelled.state).toBe('cancelled_by_yalla');
      expect(cancelled.cancelled_at).toBeDefined();
    });
  });

  describe('getWaitlist', () => {
    it('should get waitlist for experience', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-waitlist',
      });

      // 'waitlisted' is entered at intake when an experience is full
      // (createWithCapacityCheck), not via a state-machine transition.
      await pool.query("UPDATE reservations SET state = 'waitlisted' WHERE id = $1", [created.id]);

      const waitlist = await reservationModel.getWaitlist(testExperienceId);

      expect(waitlist).toBeDefined();
      expect(Array.isArray(waitlist)).toBe(true);
      expect(waitlist.length).toBeGreaterThan(0);
      expect(waitlist.every((r) => r.state === 'waitlisted')).toBe(true);
    });
  });

  describe('getRequiringReconfirmation', () => {
    it('should get reservations requiring reconfirmation', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-requiring-reconf',
      });

      await reservationModel.updateState(created.id, 'payment_pending');
      await reservationModel.updateState(created.id, 'confirmed');
      await reservationModel.updateState(created.id, 'reconfirmation_required');

      const requiring = await reservationModel.getRequiringReconfirmation();

      expect(requiring).toBeDefined();
      expect(Array.isArray(requiring)).toBe(true);
      expect(requiring.length).toBeGreaterThan(0);
      expect(requiring.every((r) => r.state === 'reconfirmation_required')).toBe(true);
    });
  });

  describe('expireOldReconfirmations', () => {
    it('should expire old reconfirmations', async () => {
      const created = await reservationModel.create({
        participant_id: testUserId,
        experience_id: testExperienceId,
        idempotency_key: 'test-key-expire',
      });

      await reservationModel.updateState(created.id, 'payment_pending');
      await reservationModel.updateState(created.id, 'confirmed');
      await reservationModel.updateState(created.id, 'reconfirmation_required');

      // Set expiry to past
      await pool.query(
        'UPDATE reservations SET expiry_at = CURRENT_TIMESTAMP - INTERVAL \'1 day\' WHERE id = $1',
        [created.id]
      );

      const expiredCount = await reservationModel.expireOldReconfirmations();

      expect(expiredCount).toBeGreaterThan(0);

      const updated = await reservationModel.findById(created.id);
      expect(updated?.state).toBe('expired');
    });
  });

  describe('getStatistics', () => {
    it('should get reservation statistics', async () => {
      const statistics = await reservationModel.getStatistics();

      expect(statistics).toBeDefined();
      expect(Array.isArray(statistics)).toBe(true);
    });
  });
});
