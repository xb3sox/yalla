import request from 'supertest';
import app from '../../src/server';
import pool from '../../src/config/database';

describe('Staff Operations API', () => {
  let staffToken: string;
  let testExperienceId: string;
  let testReservationId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create staff user
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+966504444444',
        password: 'password123',
        display_name: 'Staff User',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

    // Promote to admin: PUT /staff/users/:id/role requires it (admin also passes the staff gate)
    await pool.query(
      "UPDATE users SET role = 'admin' WHERE phone = '+966504444444'"
    );

    // Login as staff
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+966504444444',
        password: 'password123',
      });

    staffToken = loginResponse.body.data.tokens.accessToken;

    // Create test experience
    const expResponse = await request(app)
      .post('/api/v1/experiences')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        title: 'Staff Test Experience',
        title_ar: 'تجربة اختبار الموظفين',
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

    testExperienceId = expResponse.body.data.experience.id;

    // Create test user for reservations
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        phone: '+966503333333',
        password: 'password123',
        display_name: 'Test Participant',
        language: 'en',
        adult_declaration_accepted: true,
        terms_accepted: true,
      });

    const userResponse = await pool.query(
      "SELECT id FROM users WHERE phone = '+966503333333'"
    );
    testUserId = userResponse.rows[0].id;

    // Create test reservation
    const participantLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        phone: '+966503333333',
        password: 'password123',
      });

    const participantToken = participantLogin.body.data.tokens.accessToken;

    const resResponse = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({
        experience_id: testExperienceId,
        idempotency_key: 'staff-test-key',
      });

    testReservationId = resResponse.body.data.reservation.id;
  });

  // No per-file cleanup: tests/setup.ts wipes all tables before each file.

  describe('GET /api/v1/staff/dashboard', () => {
    it('should get dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/v1/staff/dashboard')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.experiences).toBeDefined();
      expect(response.body.data.reservations).toBeDefined();
      expect(response.body.data.users).toBeDefined();
      expect(response.body.data.revenue).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/staff/dashboard');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should require staff role', async () => {
      const participantLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          phone: '+966503333333',
          password: 'password123',
        });

      const participantToken = participantLogin.body.data.tokens.accessToken;

      const response = await request(app)
        .get('/api/v1/staff/dashboard')
        .set('Authorization', `Bearer ${participantToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/staff/users', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/v1/staff/users')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeDefined();
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('should filter users by role', async () => {
      const response = await request(app)
        .get('/api/v1/staff/users')
        .query({ role: 'participant' })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users.every((u: any) => u.role === 'participant')).toBe(true);
    });

    it('should filter users by active status', async () => {
      const response = await request(app)
        .get('/api/v1/staff/users')
        .query({ is_active: 'true' })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.users.every((u: any) => u.is_active === true)).toBe(true);
    });
  });

  describe('PUT /api/v1/staff/users/:id/role', () => {
    it('should update user role', async () => {
      const response = await request(app)
        .put(`/api/v1/staff/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ role: 'host' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('host');
    });

    it('should reject invalid role', async () => {
      const response = await request(app)
        .put(`/api/v1/staff/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ role: 'invalid_role' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should require admin role', async () => {
      // Create non-admin staff user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          phone: '+966502222222',
          password: 'password123',
          display_name: 'Non-Admin Staff',
          language: 'en',
          adult_declaration_accepted: true,
          terms_accepted: true,
        });

      await pool.query(
        "UPDATE users SET role = 'operations' WHERE phone = '+966502222222'"
      );

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          phone: '+966502222222',
          password: 'password123',
        });

      const nonAdminToken = loginResponse.body.data.tokens.accessToken;

      const response = await request(app)
        .put(`/api/v1/staff/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({ role: 'host' });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      // Clean up
      await pool.query("DELETE FROM users WHERE phone = '+966502222222'");
    });
  });

  describe('GET /api/v1/staff/reservations/export', () => {
    it('should export all reservations as CSV', async () => {
      const response = await request(app)
        .get('/api/v1/staff/reservations/export')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toBe('attachment; filename=reservations.csv');
      expect(response.text).toContain('id');
      expect(response.text).toContain(testReservationId);
    });

    it('should export all reservations as Excel', async () => {
      const response = await request(app)
        .get('/api/v1/staff/reservations/export')
        .query({ format: 'excel' })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers['content-disposition']).toBe('attachment; filename=reservations.xlsx');
    });

    it('should filter exported reservations by status', async () => {
      const response = await request(app)
        .get('/api/v1/staff/reservations/export')
        .query({ status: 'confirmed' })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      // It might be empty if there are no confirmed reservations, but it should still return a CSV header
      expect(response.text).toContain('id');
    });
  });

  describe('GET /api/v1/staff/reservations', () => {
    it('should get all reservations', async () => {
      const response = await request(app)
        .get('/api/v1/staff/reservations')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reservations).toBeDefined();
      expect(Array.isArray(response.body.data.reservations)).toBe(true);
    });

    it('should filter reservations by state', async () => {
      const response = await request(app)
        .get('/api/v1/staff/reservations')
        .query({ state: 'confirmed' })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.reservations.every((r: any) => r.state === 'confirmed')
      ).toBe(true);
    });

    it('should filter reservations by experience', async () => {
      const response = await request(app)
        .get('/api/v1/staff/reservations')
        .query({ experience_id: testExperienceId })
        .set('Authorization', `Bearer ${staffToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(
        response.body.data.reservations.every(
          (r: any) => r.experience_id === testExperienceId
        )
      ).toBe(true);
    });
  });

  describe('PUT /api/v1/staff/reservations/:id/state', () => {
    it('should update reservation state', async () => {
      const response = await request(app)
        .put(`/api/v1/staff/reservations/${testReservationId}/state`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ state: 'checked_in' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reservation.state).toBe('checked_in');
    });

    it('should reject invalid state transition', async () => {
      const response = await request(app)
        .put(`/api/v1/staff/reservations/${testReservationId}/state`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ state: 'initiated' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/staff/experiences/:id/state', () => {
    it('should update experience state', async () => {
      const response = await request(app)
        .put(`/api/v1/staff/experiences/${testExperienceId}/state`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ state: 'full' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.experience.plan_state).toBe('full');
    });

    it('should reject invalid state transition', async () => {
      const response = await request(app)
        .put(`/api/v1/staff/experiences/${testExperienceId}/state`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ state: 'draft' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/staff/experiences/:id/assign-host', () => {
    it('should assign host to experience', async () => {
      const response = await request(app)
        .post(`/api/v1/staff/experiences/${testExperienceId}/assign-host`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          primary_host_id: testUserId,
          backup_host_id: testUserId,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.experience.primary_host_id).toBe(testUserId);
      expect(response.body.data.experience.backup_host_id).toBe(testUserId);
    });
  });
});
