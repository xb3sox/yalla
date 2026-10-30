import request from 'supertest';
import app from '../../src/server';
import pool from '../../src/config/database';

describe('Audit API', () => {
  let staffToken: string;
  let participantToken: string;
  let testAuditEventId: string;

  beforeAll(async () => {
    // Create staff user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+966505555555',
        password: 'password123',
        display_name: 'Audit Staff User',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

    await pool.query(
      "UPDATE users SET role = 'operations' WHERE phone = '+966505555555'"
    );

    const staffLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+966505555555',
        password: 'password123',
      });

    staffToken = staffLogin.body.data.tokens.accessToken;

    // Create participant user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+966504444444',
        password: 'password123',
        display_name: 'Audit Participant',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

    const participantLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+966504444444',
        password: 'password123',
      });

    participantToken = participantLogin.body.data.tokens.accessToken;
  });

  // No per-file cleanup: tests/setup.ts wipes all tables before each file.

  describe('GET /api/v1/audit', () => {
    it('should get all audit events', async () => {
      const response = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toBeDefined();
      expect(Array.isArray(response.body.data.events)).toBe(true);
    });

    it('should filter by actor', async () => {
      const userResponse = await pool.query(
        "SELECT id FROM users WHERE phone = '+966505555555'"
      );
      const actorId = userResponse.rows[0].id;

      const response = await request(app)
        .get('/api/v1/audit')
        .query({ actor_id: actorId })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.events.every((e: any) => e.actor_id === actorId)
      ).toBe(true);
    });

    it('should filter by action', async () => {
      const response = await request(app)
        .get('/api/v1/audit')
        .query({ action: 'user_login' })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.events.every((e: any) => e.action === 'user_login')
      ).toBe(true);
    });

    it('should filter by resource type', async () => {
      const response = await request(app)
        .get('/api/v1/audit')
        .query({ resource_type: 'user' })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.events.every((e: any) => e.resource_type === 'user')
      ).toBe(true);
    });

    it('should filter by classification', async () => {
      const response = await request(app)
        .get('/api/v1/audit')
        .query({ classification: 'internal' })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.events.every((e: any) => e.classification === 'internal')
      ).toBe(true);
    });

    it('should filter by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const response = await request(app)
        .get('/api/v1/audit')
        .query({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should limit results', async () => {
      const response = await request(app)
        .get('/api/v1/audit')
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.events.length).toBeLessThanOrEqual(5);
    });

    it('should offset results', async () => {
      // Seed two events: earlier suites no longer leave audit rows behind.
      for (const action of ['offset_seed_1', 'offset_seed_2']) {
        await request(app)
          .post('/api/v1/audit')
          .set('Authorization', `Bearer ${staffToken}`)
          .send({ action, resource_type: 'system', resource_id: 'offset-test' });
      }

      const allResponse = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${staffToken}`);

      const offsetResponse = await request(app)
        .get('/api/v1/audit')
        .query({ offset: 1 })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(offsetResponse.body.data.events.length).toBe(
        allResponse.body.data.events.length - 1
      );
    });

    it('should require staff role', async () => {
      const response = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/audit');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/audit/statistics', () => {
    it('should get audit statistics', async () => {
      const response = await request(app)
        .get('/api/v1/audit/statistics')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
      expect(Array.isArray(response.body.data.statistics)).toBe(true);
    });

    it('should filter statistics by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const response = await request(app)
        .get('/api/v1/audit/statistics')
        .query({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should require operations or admin role', async () => {
      const response = await request(app)
        .get('/api/v1/audit/statistics')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/audit/resource/:resourceType/:resourceId', () => {
    it('should get audit events by resource', async () => {
      const userResponse = await pool.query(
        "SELECT id FROM users WHERE phone = '+966505555555'"
      );
      const resourceId = userResponse.rows[0].id;

      const response = await request(app)
        .get(`/api/v1/audit/resource/user/${resourceId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toBeDefined();
      expect(
        response.body.data.events.every(
          (e: any) => e.resource_type === 'user' && e.resource_id === resourceId
        )
      ).toBe(true);
    });

    it('should require staff role', async () => {
      const response = await request(app)
        .get('/api/v1/audit/resource/user/test-id')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/audit/actor/:actorId', () => {
    it('should get audit events by actor', async () => {
      const userResponse = await pool.query(
        "SELECT id FROM users WHERE phone = '+966505555555'"
      );
      const actorId = userResponse.rows[0].id;

      const response = await request(app)
        .get(`/api/v1/audit/actor/${actorId}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toBeDefined();
      expect(
        response.body.data.events.every((e: any) => e.actor_id === actorId)
      ).toBe(true);
    });

    it('should limit results', async () => {
      const userResponse = await pool.query(
        "SELECT id FROM users WHERE phone = '+966505555555'"
      );
      const actorId = userResponse.rows[0].id;

      const response = await request(app)
        .get(`/api/v1/audit/actor/${actorId}`)
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.events.length).toBeLessThanOrEqual(5);
    });

    it('should require staff role', async () => {
      const response = await request(app)
        .get('/api/v1/audit/actor/test-id')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/audit', () => {
    it('should create audit event', async () => {
      const response = await request(app)
        .post('/api/v1/audit')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          action: 'test_action',
          resource_type: 'test_resource',
          resource_id: 'test-resource-id',
          details: { test: 'data' },
          classification: 'internal',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.event).toBeDefined();
      expect(response.body.data.event.action).toBe('test_action');
      expect(response.body.data.event.resource_type).toBe('test_resource');

      testAuditEventId = response.body.data.event.id;
    });

    it('should require action, resource_type, and resource_id', async () => {
      const response = await request(app)
        .post('/api/v1/audit')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require staff role', async () => {
      const response = await request(app)
        .post('/api/v1/audit')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          action: 'test',
          resource_type: 'test',
          resource_id: 'test',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
