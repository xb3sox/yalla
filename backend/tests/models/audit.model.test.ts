import auditModel from '../../src/models/audit.model';
import userModel from '../../src/models/user.model';
import pool from '../../src/config/database';

describe('Audit Model', () => {
  let testUserId: string;
  let testAuditEventId: string;

  beforeAll(async () => {
    // Create test user
    const user = await userModel.create({
      phone: '+966505555555',
      password: 'password123',
      display_name: 'Audit Test User',
      language: 'en',
      adult_declaration_accepted: true,
      terms_accepted: true,
    });
    testUserId = user.id;
  });

  // No per-file cleanup: tests/setup.ts wipes all tables before each file.

  describe('create', () => {
    it('should create an audit event', async () => {
      const auditEvent = await auditModel.create({
        actor_id: testUserId,
        actor_role: 'participant',
        action: 'test_action',
        resource_type: 'test_resource',
        resource_id: 'test-resource-id',
        details: { test: 'data' },
        classification: 'internal',
      });

      expect(auditEvent).toBeDefined();
      expect(auditEvent.id).toBeDefined();
      expect(auditEvent.actor_id).toBe(testUserId);
      expect(auditEvent.actor_role).toBe('participant');
      expect(auditEvent.action).toBe('test_action');
      expect(auditEvent.resource_type).toBe('test_resource');
      expect(auditEvent.resource_id).toBe('test-resource-id');
      expect(auditEvent.details).toEqual({ test: 'data' });
      expect(auditEvent.classification).toBe('internal');
      expect(auditEvent.timestamp).toBeDefined();

      testAuditEventId = auditEvent.id;
    });

    it('should create audit event with default classification', async () => {
      const auditEvent = await auditModel.create({
        actor_id: testUserId,
        actor_role: 'participant',
        action: 'test_action_2',
        resource_type: 'test_resource',
        resource_id: 'test-resource-id-2',
      });

      expect(auditEvent.classification).toBe('internal');
    });

    it('should create audit event with empty details', async () => {
      const auditEvent = await auditModel.create({
        actor_id: testUserId,
        actor_role: 'participant',
        action: 'test_action_3',
        resource_type: 'test_resource',
        resource_id: 'test-resource-id-3',
        details: {},
      });

      expect(auditEvent.details).toEqual({});
    });
  });

  // No findById by design: the append-only log is queried via findAll/findByActor/findByResource.

  describe('findAll', () => {
    it('should find all audit events', async () => {
      const auditEvents = await auditModel.findAll();

      expect(auditEvents).toBeDefined();
      expect(Array.isArray(auditEvents)).toBe(true);
      expect(auditEvents.length).toBeGreaterThan(0);
    });

    it('should filter by actor', async () => {
      const auditEvents = await auditModel.findAll({ actor_id: testUserId });

      expect(auditEvents).toBeDefined();
      expect(auditEvents.every((ae) => ae.actor_id === testUserId)).toBe(true);
    });

    it('should filter by action', async () => {
      const auditEvents = await auditModel.findAll({ action: 'test_action' });

      expect(auditEvents).toBeDefined();
      expect(auditEvents.every((ae) => ae.action === 'test_action')).toBe(true);
    });

    it('should filter by resource type', async () => {
      const auditEvents = await auditModel.findAll({ resource_type: 'test_resource' });

      expect(auditEvents).toBeDefined();
      expect(auditEvents.every((ae) => ae.resource_type === 'test_resource')).toBe(true);
    });

    it('should filter by resource ID', async () => {
      const auditEvents = await auditModel.findAll({ resource_id: 'test-resource-id' });

      expect(auditEvents).toBeDefined();
      expect(auditEvents.every((ae) => ae.resource_id === 'test-resource-id')).toBe(true);
    });

    it('should filter by classification', async () => {
      const auditEvents = await auditModel.findAll({ classification: 'internal' });

      expect(auditEvents).toBeDefined();
      expect(auditEvents.every((ae) => ae.classification === 'internal')).toBe(true);
    });

    it('should filter by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const auditEvents = await auditModel.findAll({ start_date: startDate, end_date: endDate });

      expect(auditEvents).toBeDefined();
      expect(auditEvents.length).toBeGreaterThan(0);
    });

    it('should limit results', async () => {
      const auditEvents = await auditModel.findAll({ limit: 1 });

      expect(auditEvents).toBeDefined();
      expect(auditEvents.length).toBeLessThanOrEqual(1);
    });

    it('should offset results', async () => {
      const allEvents = await auditModel.findAll();
      const offsetEvents = await auditModel.findAll({ offset: 1 });

      expect(offsetEvents.length).toBe(allEvents.length - 1);
    });

    it('should combine multiple filters', async () => {
      const auditEvents = await auditModel.findAll({
        actor_id: testUserId,
        action: 'test_action',
        classification: 'internal',
      });

      expect(auditEvents).toBeDefined();
      expect(
        auditEvents.every(
          (ae) =>
            ae.actor_id === testUserId &&
            ae.action === 'test_action' &&
            ae.classification === 'internal'
        )
      ).toBe(true);
    });
  });

  describe('findByResource', () => {
    it('should find audit events by resource', async () => {
      const auditEvents = await auditModel.findByResource(
        'test_resource',
        'test-resource-id'
      );

      expect(auditEvents).toBeDefined();
      expect(Array.isArray(auditEvents)).toBe(true);
      expect(auditEvents.length).toBeGreaterThan(0);
      expect(
        auditEvents.every(
          (ae) =>
            ae.resource_type === 'test_resource' &&
            ae.resource_id === 'test-resource-id'
        )
      ).toBe(true);
    });
  });

  describe('findByActor', () => {
    it('should find audit events by actor', async () => {
      const auditEvents = await auditModel.findByActor(testUserId);

      expect(auditEvents).toBeDefined();
      expect(Array.isArray(auditEvents)).toBe(true);
      expect(auditEvents.length).toBeGreaterThan(0);
      expect(auditEvents.every((ae) => ae.actor_id === testUserId)).toBe(true);
    });

    it('should limit results', async () => {
      const auditEvents = await auditModel.findByActor(testUserId, 1);

      expect(auditEvents).toBeDefined();
      expect(auditEvents.length).toBeLessThanOrEqual(1);
    });
  });

  describe('logLogin', () => {
    it('should log user login', async () => {
      const auditEvent = await auditModel.logLogin(testUserId, 'participant', '127.0.0.1');

      expect(auditEvent).toBeDefined();
      expect(auditEvent.actor_id).toBe(testUserId);
      expect(auditEvent.actor_role).toBe('participant');
      expect(auditEvent.action).toBe('user_login');
      expect(auditEvent.resource_type).toBe('user');
      expect(auditEvent.resource_id).toBe(testUserId);
      expect(auditEvent.details).toEqual({ ip_address: '127.0.0.1' });
      expect(auditEvent.classification).toBe('internal');
    });
  });

  describe('logLogout', () => {
    it('should log user logout', async () => {
      const auditEvent = await auditModel.logLogout(testUserId, 'participant');

      expect(auditEvent).toBeDefined();
      expect(auditEvent.actor_id).toBe(testUserId);
      expect(auditEvent.actor_role).toBe('participant');
      expect(auditEvent.action).toBe('user_logout');
      expect(auditEvent.resource_type).toBe('user');
      expect(auditEvent.resource_id).toBe(testUserId);
      expect(auditEvent.classification).toBe('internal');
    });
  });

  describe('logReservationCreated', () => {
    it('should log reservation creation', async () => {
      const auditEvent = await auditModel.logReservationCreated(
        testUserId,
        'participant',
        'test-reservation-id',
        'test-experience-id'
      );

      expect(auditEvent).toBeDefined();
      expect(auditEvent.actor_id).toBe(testUserId);
      expect(auditEvent.actor_role).toBe('participant');
      expect(auditEvent.action).toBe('reservation_created');
      expect(auditEvent.resource_type).toBe('reservation');
      expect(auditEvent.resource_id).toBe('test-reservation-id');
      expect(auditEvent.details).toEqual({ experience_id: 'test-experience-id' });
      expect(auditEvent.classification).toBe('confidential');
    });
  });

  describe('logReservationCancelled', () => {
    it('should log reservation cancellation', async () => {
      const auditEvent = await auditModel.logReservationCancelled(
        testUserId,
        'participant',
        'test-reservation-id',
        'User requested cancellation'
      );

      expect(auditEvent).toBeDefined();
      expect(auditEvent.actor_id).toBe(testUserId);
      expect(auditEvent.actor_role).toBe('participant');
      expect(auditEvent.action).toBe('reservation_cancelled');
      expect(auditEvent.resource_type).toBe('reservation');
      expect(auditEvent.resource_id).toBe('test-reservation-id');
      expect(auditEvent.details).toEqual({ reason: 'User requested cancellation' });
      expect(auditEvent.classification).toBe('confidential');
    });
  });

  describe('logPaymentCreated', () => {
    it('should log payment creation', async () => {
      const auditEvent = await auditModel.logPaymentCreated(
        testUserId,
        'participant',
        'test-payment-id',
        'test-reservation-id',
        100
      );

      expect(auditEvent).toBeDefined();
      expect(auditEvent.actor_id).toBe(testUserId);
      expect(auditEvent.actor_role).toBe('participant');
      expect(auditEvent.action).toBe('payment_created');
      expect(auditEvent.resource_type).toBe('payment');
      expect(auditEvent.resource_id).toBe('test-payment-id');
      expect(auditEvent.details).toEqual({
        reservation_id: 'test-reservation-id',
        amount: 100,
      });
      expect(auditEvent.classification).toBe('restricted');
    });
  });

  describe('logRefundProcessed', () => {
    it('should log refund processing', async () => {
      const auditEvent = await auditModel.logRefundProcessed(
        testUserId,
        'operations',
        'test-payment-id',
        50
      );

      expect(auditEvent).toBeDefined();
      expect(auditEvent.actor_id).toBe(testUserId);
      expect(auditEvent.actor_role).toBe('operations');
      expect(auditEvent.action).toBe('refund_processed');
      expect(auditEvent.resource_type).toBe('payment');
      expect(auditEvent.resource_id).toBe('test-payment-id');
      expect(auditEvent.details).toEqual({ amount: 50 });
      expect(auditEvent.classification).toBe('restricted');
    });
  });

  describe('logExperienceCreated', () => {
    it('should log experience creation', async () => {
      const auditEvent = await auditModel.logExperienceCreated(
        testUserId,
        'operations',
        'test-experience-id',
        'Test Experience'
      );

      expect(auditEvent).toBeDefined();
      expect(auditEvent.actor_id).toBe(testUserId);
      expect(auditEvent.actor_role).toBe('operations');
      expect(auditEvent.action).toBe('experience_created');
      expect(auditEvent.resource_type).toBe('experience');
      expect(auditEvent.resource_id).toBe('test-experience-id');
      expect(auditEvent.details).toEqual({ title: 'Test Experience' });
      expect(auditEvent.classification).toBe('internal');
    });
  });

  describe('logExperienceUpdated', () => {
    it('should log experience update', async () => {
      const auditEvent = await auditModel.logExperienceUpdated(
        testUserId,
        'operations',
        'test-experience-id',
        { title: 'Updated Title', price: 150 }
      );

      expect(auditEvent).toBeDefined();
      expect(auditEvent.actor_id).toBe(testUserId);
      expect(auditEvent.actor_role).toBe('operations');
      expect(auditEvent.action).toBe('experience_updated');
      expect(auditEvent.resource_type).toBe('experience');
      expect(auditEvent.resource_id).toBe('test-experience-id');
      expect(auditEvent.details).toEqual({ changes: { title: 'Updated Title', price: 150 } });
      expect(auditEvent.classification).toBe('internal');
    });
  });

  describe('logUserBlocked', () => {
    it('should log user block', async () => {
      const auditEvent = await auditModel.logUserBlocked(
        testUserId,
        'participant',
        'blocked-user-id',
        'Inappropriate behavior'
      );

      expect(auditEvent).toBeDefined();
      expect(auditEvent.actor_id).toBe(testUserId);
      expect(auditEvent.actor_role).toBe('participant');
      expect(auditEvent.action).toBe('user_blocked');
      expect(auditEvent.resource_type).toBe('block');
      expect(auditEvent.resource_id).toBe('blocked-user-id');
      expect(auditEvent.details).toEqual({ reason: 'Inappropriate behavior' });
      expect(auditEvent.classification).toBe('restricted');
    });
  });

  describe('logSafetyCaseCreated', () => {
    it('should log safety case creation', async () => {
      const auditEvent = await auditModel.logSafetyCaseCreated(
        testUserId,
        'participant',
        'test-safety-case-id',
        'harassment'
      );

      expect(auditEvent).toBeDefined();
      expect(auditEvent.actor_id).toBe(testUserId);
      expect(auditEvent.actor_role).toBe('participant');
      expect(auditEvent.action).toBe('safety_case_created');
      expect(auditEvent.resource_type).toBe('safety_case');
      expect(auditEvent.resource_id).toBe('test-safety-case-id');
      expect(auditEvent.details).toEqual({ category: 'harassment' });
      expect(auditEvent.classification).toBe('restricted');
    });
  });

  describe('getStatistics', () => {
    it('should get audit statistics', async () => {
      const stats = await auditModel.getStatistics();

      expect(stats).toBeDefined();
      expect(Array.isArray(stats)).toBe(true);

      // Should have action and count
      stats.forEach((stat: any) => {
        expect(stat.action).toBeDefined();
        expect(stat.count).toBeDefined();
        expect(typeof stat.count).toBe('number');
      });
    });

    it('should filter statistics by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const stats = await auditModel.getStatistics(startDate, endDate);

      expect(stats).toBeDefined();
      expect(Array.isArray(stats)).toBe(true);
    });
  });
});
