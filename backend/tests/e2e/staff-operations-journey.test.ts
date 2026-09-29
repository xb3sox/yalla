import request from 'supertest';
import app from '../src/server';
import pool from '../src/config/database';

describe('Complete User Journey - Staff Operations', () => {
  let operationsToken: string;
  let participantToken: string;
  let experienceId: string;
  let reservationId: string;

  beforeAll(async () => {
    // Clean up
    await pool.query("DELETE FROM users WHERE phone IN ('+966508888881', '+966508888882')");
    await pool.query("DELETE FROM experiences WHERE title = 'Staff Operations Test'");

    // Create operations user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+966508888881',
        password: 'password123',
        display_name: 'Operations Staff',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

    await pool.query(
      "UPDATE users SET role = 'operations' WHERE phone = '+966508888881'"
    );

    const opsLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+966508888881',
        password: 'password123',
      });

    operationsToken = opsLogin.body.data.tokens.accessToken;

    // Create participant
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+966508888882',
        password: 'password123',
        display_name: 'Test Participant',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

    const partLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+966508888882',
        password: 'password123',
      });

    participantToken = partLogin.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    if (reservationId) await pool.query('DELETE FROM reservations WHERE id = $1', [reservationId]);
    if (experienceId) await pool.query('DELETE FROM experiences WHERE id = $1', [experienceId]);
    await pool.query("DELETE FROM users WHERE phone IN ('+966508888881', '+966508888882')");
  });

  describe('Step 1: Create Experience', () => {
    it('should create a new experience', async () => {
      const response = await request(app)
        .post('/api/v1/experiences')
        .set('Authorization', `Bearer ${operationsToken}`)
        .send({
          title: 'Staff Operations Test',
          title_ar: 'اختبار عمليات الموظفين',
          description: 'Test experience for staff operations',
          description_ar: 'تجربة اختبار لعمليات الموظفين',
          date: '2026-04-01',
          time: '14:00',
          duration: '3 hours',
          duration_minutes: 180,
          area: 'Riyadh',
          area_ar: 'الرياض',
          group_size_min: 5,
          group_size_max: 10,
          language: 'en',
          price: 200,
          capacity: 10,
          plan_state: 'draft',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      experienceId = response.body.data.experience.id;
      expect(response.body.data.experience.plan_state).toBe('draft');
    });
  });

  describe('Step 2: Update Experience State', () => {
    it('should update experience state to published', async () => {
      const response = await request(app)
        .put(`/api/v1/staff/experiences/${experienceId}/state`)
        .set('Authorization', `Bearer ${operationsToken}`)
        .send({ state: 'published' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.experience.plan_state).toBe('published');
    });

    it('should reject invalid state transition', async () => {
      const response = await request(app)
        .put(`/api/v1/staff/experiences/${experienceId}/state`)
        .set('Authorization', `Bearer ${operationsToken}`)
        .send({ state: 'draft' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Step 3: Assign Host', () => {
    it('should assign host to experience', async () => {
      const response = await request(app)
        .post(`/api/v1/staff/experiences/${experienceId}/assign-host`)
        .set('Authorization', `Bearer ${operationsToken}`)
        .send({
          primary_host_id: 'host-001',
          backup_host_id: 'host-002',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Step 4: Participant Books Experience', () => {
    it('should create reservation', async () => {
      const response = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${participantToken}`)
        .send({
          experience_id: experienceId,
          idempotency_key: `staff-e2e-${Date.now()}`,
        });

      expect(response.status).toBe(201);
      reservationId = response.body.data.reservation.id;
    });
  });

  describe('Step 5: Staff Views Dashboard', () => {
    it('should get dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/v1/staff/dashboard')
        .set('Authorization', `Bearer ${operationsToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.totalExperiences).toBeDefined();
      expect(response.body.data.statistics.totalReservations).toBeDefined();
    });
  });

  describe('Step 6: Staff Views All Reservations', () => {
    it('should get all reservations', async () => {
      const response = await request(app)
        .get('/api/v1/staff/reservations')
        .set('Authorization', `Bearer ${operationsToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reservations).toBeDefined();
      expect(response.body.data.reservations.length).toBeGreaterThan(0);
    });

    it('should filter reservations by state', async () => {
      const response = await request(app)
        .get('/api/v1/staff/reservations')
        .query({ state: 'confirmed' })
        .set('Authorization', `Bearer ${operationsToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.reservations.every((r: any) => r.state === 'confirmed')
      ).toBe(true);
    });
  });

  describe('Step 7: Staff Updates Reservation State', () => {
    it('should update reservation to checked_in', async () => {
      const response = await request(app)
        .put(`/api/v1/staff/reservations/${reservationId}/state`)
        .set('Authorization', `Bearer ${operationsToken}`)
        .send({ state: 'checked_in' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reservation.state).toBe('checked_in');
    });

    it('should update reservation to attended', async () => {
      const response = await request(app)
        .put(`/api/v1/staff/reservations/${reservationId}/state`)
        .set('Authorization', `Bearer ${operationsToken}`)
        .send({ state: 'attended' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reservation.state).toBe('attended');
    });
  });

  describe('Step 8: Staff Views Users', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/v1/staff/users')
        .set('Authorization', `Bearer ${operationsToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.users.length).toBeGreaterThan(0);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/v1/staff/users')
        .query({ role: 'participant' })
        .set('Authorization', `Bearer ${operationsToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.users.every((u: any) => u.role === 'participant')
      ).toBe(true);
    });
  });

  describe('Step 9: Staff Views Audit Log', () => {
    it('should get audit events', async () => {
      const response = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${operationsToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toBeDefined();
      expect(response.body.data.events.length).toBeGreaterThan(0);
    });

    it('should filter audit events by action', async () => {
      const response = await request(app)
        .get('/api/v1/audit')
        .query({ action: 'reservation_state_updated' })
        .set('Authorization', `Bearer ${operationsToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.events.every(
          (e: any) => e.action === 'reservation_state_updated'
        )
      ).toBe(true);
    });
  });

  describe('Step 10: Update Experience', () => {
    it('should update experience details', async () => {
      const response = await request(app)
        .put(`/api/v1/experiences/${experienceId}`)
        .set('Authorization', `Bearer ${operationsToken}`)
        .send({
          title: 'Updated Staff Operations Test',
          price: 250,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.experience.title).toBe('Updated Staff Operations Test');
      expect(response.body.data.experience.price).toBe(250);
    });
  });

  describe('Step 11: Delete Experience', () => {
    it('should delete experience', async () => {
      const response = await request(app)
        .delete(`/api/v1/experiences/${experienceId}`)
        .set('Authorization', `Bearer ${operationsToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not find deleted experience', async () => {
      const response = await request(app)
        .get(`/api/v1/experiences/${experienceId}`)
        .set('Authorization', `Bearer ${operationsToken}`);

      expect(response.status).toBe(404);
    });
  });
});
